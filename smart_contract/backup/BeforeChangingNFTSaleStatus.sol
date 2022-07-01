// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../node_modules/@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract NFTMarketplace is ERC721URIStorage, EIP712, Ownable {
    struct NFTItem {
        uint256 tokenId;
        string tokenURI; // Only pass ipfs hash, not the whole URI. Actual URL will be baseURI+tokenURI(hash)
        uint256 price;
        address creator;
        address owner;
        bool isForSale;
    }

    struct NFTVoucher {
        uint256 tokenId;
        string tokenURI;
        uint256 price;
        bool isForSale;
        bytes signature;
        bool isAuction;
        address target;
        bool isRedeem;
    }

    uint256 public serviceCharge = 5000; // 5% by default. 1000 -> 1%
    string public baseURI; // Base URI for token URI. MUST end with '/' like https://gateway.pinata.cloud/ipfs/
    uint256[] private _nftItems; // Array of item token id

    mapping(string => bool) private _doesTokenURIExistsMapping; /* tokenURI: true */
    mapping(uint256 => NFTItem) private _mapTokenIdToNFTItem; /* tokenId: NFTItem */
    mapping(uint256 => uint256) private _mapTokenIdToNFTItemIndex; /* tokenId: index */ // This is all NFT Items index
    mapping(address => mapping(uint256 => uint256))
        private _mapOwnerToNFTItemIndexToNFTTokenId; /* address: { index: tokenId } -> This is for all NFT Items by owner */
    mapping(uint256 => uint256) private _mapTokenIdToItemsCountIndex; // tokenId => nftItemsCount // This is not all nft items index.

    mapping(address => uint256) private _mapOwnerToItemsCreatedCount; /* address: nft item created count */
    mapping(address => uint256) private _mapOwnerToItemsForSaleCount; /* address: nft item for sale count */
    mapping(address => uint256) private _mapOwnerToItemsSoldCount; /* address: nft item sold count */

    uint256 private _numberOfItems; // Does not keep track of burned tokens
    uint256 private _numberOfItemsForSale; // Keep track of active number of items on sale

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory sig_domain,
        string memory sign_version
    ) ERC721(_name, _symbol) EIP712(sig_domain, sign_version) {
        changeBaseURI(_initBaseURI);
    }

    receive() external payable {}

    function withdrawBalance(uint256 amount) external payable onlyOwner {
        require(amount <= address(this).balance); //NOT_ENOUGH_BALANCE
        payable(msg.sender).transfer(address(this).balance);
    }

    function mintToken(NFTVoucher calldata voucher) public payable {
        require(!voucher.isRedeem);
        address _signer = _verifySignature(voucher);
        require(_signer == msg.sender);
        _createNFTItem(
            voucher.tokenId,
            voucher.tokenURI,
            voucher.price,
            voucher.isForSale,
            _signer
        );
        _safeMint(_signer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, string.concat(baseURI, voucher.tokenURI));
    }

    function redeemToken(NFTVoucher calldata voucher) public payable {
        require(voucher.isRedeem);
        require(msg.value == voucher.price);
        address _signer = _verifySignature(voucher);
        require(_signer != msg.sender);

        if (voucher.isAuction) {
            require(voucher.target == msg.sender);
        }

        // Mint
        _createNFTItem(
            voucher.tokenId,
            voucher.tokenURI,
            voucher.price,
            voucher.isRedeem ? false : voucher.isForSale,
            voucher.isRedeem ? _signer : msg.sender
        );
        _safeMint(voucher.isRedeem ? _signer : msg.sender, voucher.tokenId);
        _setTokenURI(voucher.tokenId, string.concat(baseURI, voucher.tokenURI));
        // Transfer
        _mapOwnerToItemsSoldCount[_signer] += 1;
        _transfer(_signer, msg.sender, voucher.tokenId);
        payable(_signer).transfer(
            msg.value - ((msg.value * serviceCharge) / (100000))
        );
    }

    function buyNFT(uint256 tokenId) public payable {
        address ownerAddress = ERC721.ownerOf(tokenId);
        require(
            msg.sender != ownerAddress &&
                msg.sender != _mapTokenIdToNFTItem[tokenId].creator
        ); //ALREADY_NFT_OWNER Or CANNOT_BUY_YOUR_OWN_CREATION
        require(msg.value == _mapTokenIdToNFTItem[tokenId].price); //PRICE_MISTMATCH
        _mapOwnerToItemsForSaleCount[ownerAddress] -= 1;
        _mapTokenIdToNFTItem[tokenId].isForSale = false;
        _numberOfItemsForSale -= 1;
        _mapOwnerToItemsSoldCount[ownerAddress] += 1;
        _mapTokenIdToNFTItem[tokenId].owner = msg.sender;

        _transfer(ownerAddress, msg.sender, tokenId);
        payable(ownerAddress).transfer(
            msg.value - ((msg.value * serviceCharge) / (100000))
        );
    }

    function burnToken(uint256 tokenId) public payable {
        require(msg.sender == ERC721.ownerOf(tokenId)); // NOT_THE_NFT_OWNER
        _removeNFT(tokenId);
        _burn(tokenId);
    }

    function changeNFTSaleStatus(
        uint256 tokenId,
        uint256 newPrice,
        bool changeToIsForSale
    ) public payable {
        require(msg.sender == ERC721.ownerOf(tokenId)); // NOT_THE_NFT_OWNER
        require(
            changeToIsForSale
                ? !_mapTokenIdToNFTItem[tokenId].isForSale
                : _mapTokenIdToNFTItem[tokenId].isForSale
        ); // ALREADY_ON_SALE OR ALREADY_ON_NOT_FOR_SALE
        if (changeToIsForSale) {
            _mapTokenIdToNFTItem[tokenId].price = newPrice;
            _mapOwnerToItemsForSaleCount[ERC721.ownerOf(tokenId)] += 1;
            _numberOfItemsForSale += 1;
        } else {
            _mapOwnerToItemsForSaleCount[ERC721.ownerOf(tokenId)] -= 1;
            _numberOfItemsForSale -= 1;
        }
        _mapTokenIdToNFTItem[tokenId].isForSale = changeToIsForSale;
    }

    // Get All NFT Items for Sale: All NFTs in the contract that are for sale
    function getItemsForSale() public view returns (NFTItem[] memory) {
        NFTItem[] memory itemsForSale = new NFTItem[](_numberOfItemsForSale);
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.isForSale) {
                nftItem.tokenURI = string.concat(baseURI, nftItem.tokenURI);
                itemsForSale[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsForSale;
    }

    // Get NFT Item by tokenId
    function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
        NFTItem memory item = _mapTokenIdToNFTItem[tokenId];
        item.tokenURI = string.concat(baseURI, item.tokenURI);
        return item;
    }

    // 1 = All Items Created By User
    // 2 = All Items Currently Owned By User
    // 3 = All Items For Sale By User
    // 4 =  All Items Not For Sale By User
    // 5 = All Items Sold By User
    function getItemsByUser(address user, uint256 kind)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory items = new NFTItem[](
            kind == 2 ? ERC721.balanceOf(user) : kind == 3
                ? _mapOwnerToItemsForSaleCount[user]
                : kind == 4
                ? (ERC721.balanceOf(user) - _mapOwnerToItemsForSaleCount[user])
                : kind == 5
                ? _mapOwnerToItemsSoldCount[user]
                : _mapOwnerToItemsCreatedCount[user]
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            nftItem.tokenURI = string.concat(baseURI, nftItem.tokenURI);
            if (kind == 2) {
                if (nftItem.owner == user) {
                    items[currentIndex] = nftItem;
                    currentIndex++;
                }
            } else if (kind == 3) {
                if (nftItem.owner == user && nftItem.isForSale) {
                    items[currentIndex] = nftItem;
                    currentIndex++;
                }
            } else if (kind == 4) {
                if (nftItem.owner == user && !nftItem.isForSale) {
                    items[currentIndex] = nftItem;
                    currentIndex++;
                }
            } else if (kind == 5) {
                if (nftItem.creator == user && nftItem.owner != user) {
                    items[currentIndex] = nftItem;
                    currentIndex++;
                }
            } else {
                if (nftItem.creator == user) {
                    items[currentIndex] = nftItem;
                    currentIndex++;
                }
            }
        }
        return items;
    }

    // Ge the user nft details count in one function
    function getNFTItemCountUtilityByUser(address userAddress)
        public
        view
        returns (uint256[4] memory)
    {
        return [
            _mapOwnerToItemsCreatedCount[userAddress], // Total NFT Items Created
            ERC721.balanceOf(userAddress), // Total NFT Items Owned
            _mapOwnerToItemsForSaleCount[userAddress], // Total NFT Items Owned for sale
            _mapOwnerToItemsSoldCount[userAddress] // Total NFT Items Sold,
        ];
    }

    // Change Service Charge: Only for admin
    // Should sent percentage value like if 5% => 5000
    function changeServiceCharge(uint256 newSc) public onlyOwner {
        require(newSc < 100000);
        serviceCharge = newSc;
    }

    // Change Service Charge: Only for admin
    // Should sent percentage value
    function changeBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    // Verifies the signature for a given NFTVoucher, returning the address of the signer.
    // Will revert if the signature is invalid.
    function _verifySignature(NFTVoucher calldata voucher)
        internal
        view
        returns (address)
    {
        return
            ECDSA.recover(
                _hashTypedDataV4(
                    keccak256(
                        abi.encode(
                            keccak256(
                                "NFTVoucher(uint256 tokenId, string tokenURI, uint256 price, bool isForSale,  bool isAuction, address target, bool isRedeem)"
                            ),
                            voucher.tokenId,
                            keccak256(bytes(voucher.tokenURI)),
                            voucher.price,
                            voucher.isForSale,
                            voucher.isAuction,
                            voucher.target,
                            voucher.isRedeem
                        )
                    )
                ),
                voucher.signature
            );
    }

    function _createNFTItem(
        uint256 tokenId,
        string memory tokenURI,
        uint256 price,
        bool isForSale,
        address creator
    ) private {
        require(!_doesTokenURIExistsMapping[tokenURI]);
        require(price > 0); // INVALID_PRICE
        _mapTokenIdToNFTItem[tokenId] = NFTItem(
            tokenId,
            tokenURI,
            price,
            creator,
            msg.sender,
            isForSale
        );
        _doesTokenURIExistsMapping[tokenURI] = true;
        _numberOfItems += 1;
        _mapOwnerToItemsCreatedCount[creator] += 1;
        if (isForSale) {
            _numberOfItemsForSale += 1;
            _mapOwnerToItemsForSaleCount[msg.sender] += 1;
        }
    }

    function _removeNFT(uint256 tokenId) private {
        NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
        delete _doesTokenURIExistsMapping[nftItem.tokenURI];
        delete _mapTokenIdToNFTItem[tokenId];
        _numberOfItems -= 1;
        _mapOwnerToItemsCreatedCount[msg.sender] -= 1;
        if (nftItem.isForSale) {
            _numberOfItemsForSale -= 1;
            _mapOwnerToItemsForSaleCount[msg.sender] += 1;
        }
    }

    function _addTokenToAllTokens(uint256 tokenId) private {
        _mapTokenIdToNFTItemIndex[tokenId] = _nftItems.length;
        _nftItems.push(tokenId);
    }

    function _addTokenToOwner(uint256 tokenId, address owner) private {
        uint256 ownedTokensLength = ERC721.balanceOf(owner);
        _mapOwnerToNFTItemIndexToNFTTokenId[owner][ownedTokensLength] = tokenId; // This index is not the index for allItems. This index is only for owned items by user.
        _mapTokenIdToItemsCountIndex[tokenId] = ownedTokensLength;
    }

    //
    function _removeTokenFromAllTokens(uint256 tokenId) private {
        uint256 tokenIndex = _mapTokenIdToNFTItemIndex[tokenId];
        uint256 lastTokenId = _nftItems[_nftItems.length - 1];

        _nftItems[tokenIndex] = lastTokenId;
        _mapTokenIdToNFTItemIndex[lastTokenId] = tokenIndex;

        delete _mapTokenIdToNFTItemIndex[tokenId];
        _nftItems.pop();
    }

    function _removeTokenFromOwner(uint256 tokenId, address owner) private {
        uint256 lastTokenIndex = ERC721.balanceOf(owner) - 1;
        uint256 tokenIndex = _mapTokenIdToItemsCountIndex[tokenId];

        if (lastTokenIndex != tokenIndex) {
            uint256 lastTokenId = _mapOwnerToNFTItemIndexToNFTTokenId[owner][
                lastTokenIndex
            ];
            _mapOwnerToNFTItemIndexToNFTTokenId[owner][
                tokenIndex
            ] = lastTokenId;
            _mapTokenIdToItemsCountIndex[lastTokenId] = tokenIndex;
        }

        delete _mapOwnerToNFTItemIndexToNFTTokenId[owner][lastTokenIndex];
        delete _mapTokenIdToItemsCountIndex[tokenId];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            // Mint Only
            _addTokenToAllTokens(tokenId);
        } else if (from != to) {
            // Tranfer (This is also called when token is burned)
            _removeTokenFromOwner(tokenId, from);
        }

        if (to == address(0)) {
            // Burn the token (Delete): This is also called when transfer is done
            _removeTokenFromAllTokens(tokenId);
        } else if (to != from) {
            // Tranfer (This is also called when mint is done)
            _addTokenToOwner(tokenId, to);
        }
    }
}
