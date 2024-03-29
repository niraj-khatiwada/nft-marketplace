// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "./PriceConsumerV3.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../node_modules/@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract NFTMarketplace is ERC721URIStorage, EIP712, Ownable, PriceConsumerV3 {
    bytes32 internal constant V_HASH =
        keccak256(
            "NFTVoucher(uint256 tokenId,string tokenURI,uint256 price,bool isForSale,bool isAuction,address target,bool isRedeem,uint256 startDate,uint256 endDate)"
        );

    struct NFTItem {
        uint256 tokenId;
        string tokenURI;
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
        uint256 startDate;
        uint256 endDate;
    }

    uint256 public serviceCharge = 5000; // 5% by default. 1000 -> 1%
    string public baseURI;
    uint256[] private _nftItems; // Array of item token id

    mapping(uint256 => NFTItem) private _mapTokenIdToNFTItem; /* tokenId: NFTItem */
    mapping(uint256 => uint256) private _mapTokenIdToNFTItemIndex; /* tokenId: index */ // This is all NFT Items index
    mapping(address => mapping(uint256 => uint256))
        private _mapOwnerToNFTItemIndexToNFTTokenId; /* address: { index: tokenId } -> This is for all NFT Items by owner */
    mapping(uint256 => uint256) private _mapTokenIdToItemsCountIndex; // tokenId => nftItemsCount // This is not all nft items index.

    mapping(address => uint256) private _mapOwnerToItemsCreatedCount; /* address: nft item created count */
    mapping(address => uint256) private _mapOwnerToItemsForSaleCount; /* address: nft item for sale count */
    mapping(address => uint256[]) private _mapOwnerToTokenIdOfItemsSold; /* address: token id of nft item sold */
    mapping(uint256 => bool) private _mapIsTokenBurned; /* tokenId -> true */

    uint256 private _numberOfItems; // Does not keep track of burned tokens
    uint256 private _numberOfItemsForSale; // Keep track of active number of items on sale

    event BalanceWithdrawn(uint256 amount, uint256 lastBalance);
    event TokenMinted(NFTVoucher voucher);
    event TokenRedeemed(NFTVoucher voucher, address sender);
    event NFTBought(NFTItem item, address sender);
    event TokenBurned(NFTItem item, address sender);
    event SaleStatusChanged(NFTItem item, bool newStatus, uint256 newPrice);
    event ServiceChargeChanged(uint256 newCharge, uint256 oldCharge);
    event BaseURIChanged(string newURI, string oldURI);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI
    ) ERC721(_name, _symbol) EIP712("XungibleEIP712", "1") {
        require(
            bytes(_name).length > 0 &&
                bytes(_symbol).length > 0 &&
                bytes(_initBaseURI).length > 0
        );
        changeBaseURI(_initBaseURI);
    }

    receive() external payable {}

    function withdrawBalance(uint256 amount) external payable onlyOwner {
        uint256 lastBalance = address(this).balance;
        require(amount <= lastBalance); //NOT_ENOUGH_BALANCE
        payable(msg.sender).transfer(amount);
        emit BalanceWithdrawn(amount, lastBalance);
    }

    function mintToken(NFTVoucher calldata voucher) public payable {
        require(!voucher.isAuction); // Cannot mint auction type directly
        address _signer = verifyVoucher(voucher);
        require(_signer == msg.sender && _signer == voucher.target);
        _createNFTItem(
            voucher.tokenId,
            voucher.tokenURI,
            voucher.price,
            voucher.isForSale,
            _signer
        );
        _safeMint(_signer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.tokenURI);
        emit TokenMinted(voucher);
    }

    function redeemToken(NFTVoucher calldata voucher) public payable {
        require(voucher.isRedeem && voucher.isForSale);
        require(msg.value == voucher.price);
        address _signer = verifyVoucher(voucher);
        require(_signer != msg.sender);
        if (voucher.isAuction) {
            require(
                voucher.startDate < voucher.endDate &&
                    (block.timestamp * 1000) > voucher.endDate
            );
        }
        require(
            voucher.isAuction
                ? voucher.target == msg.sender
                : voucher.target == _signer
        );
        _createNFTItem(
            voucher.tokenId,
            voucher.tokenURI,
            voucher.price,
            false,
            _signer
        );
        // Mint
        _safeMint(_signer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.tokenURI);
        // Transfer
        _mapOwnerToTokenIdOfItemsSold[_signer].push(voucher.tokenId);
        _transfer(_signer, msg.sender, voucher.tokenId);
        payable(_signer).transfer(
            msg.value - ((msg.value * serviceCharge) / (100000))
        );
        emit TokenRedeemed(voucher, msg.sender);
    }

    function buyNFT(uint256 tokenId) public payable {
        address ownerAddress = ERC721.ownerOf(tokenId);
        require(msg.sender != ownerAddress); //ALREADY_NFT_OWNER
        NFTItem memory item = _mapTokenIdToNFTItem[tokenId];
        require(item.isForSale);
        require(msg.value == item.price); //PRICE_MISTMATCH
        _mapOwnerToItemsForSaleCount[ownerAddress] -= 1;
        _mapTokenIdToNFTItem[tokenId].isForSale = false;
        _numberOfItemsForSale -= 1;
        _mapOwnerToTokenIdOfItemsSold[ownerAddress].push(tokenId);
        _mapTokenIdToNFTItem[tokenId].owner = msg.sender;

        _transfer(ownerAddress, msg.sender, tokenId);
        payable(ownerAddress).transfer(
            msg.value - ((msg.value * serviceCharge) / (100000))
        );
        emit NFTBought(item, msg.sender);
    }

    function burnToken(uint256 tokenId) public payable {
        require(msg.sender == ERC721.ownerOf(tokenId)); // NOT_THE_NFT_OWNER
        NFTItem memory item = _removeNFT(tokenId);
        _burn(tokenId);
        _mapIsTokenBurned[tokenId] = true;
        emit TokenBurned(item, msg.sender);
    }

    function changeNFTSaleStatus(
        uint256 tokenId,
        uint256 newPrice,
        bool changeToIsForSale
    ) public payable {
        require(msg.sender == ERC721.ownerOf(tokenId)); // NOT_THE_NFT_OWNER
        NFTItem memory item = _mapTokenIdToNFTItem[tokenId];
        require(changeToIsForSale ? !item.isForSale : item.isForSale); // ALREADY_ON_SALE OR ALREADY_ON_NOT_FOR_SALE
        if (changeToIsForSale) {
            _mapTokenIdToNFTItem[tokenId].price = newPrice;
            _mapOwnerToItemsForSaleCount[ERC721.ownerOf(tokenId)] += 1;
            _numberOfItemsForSale += 1;
        } else {
            _mapOwnerToItemsForSaleCount[ERC721.ownerOf(tokenId)] -= 1;
            _numberOfItemsForSale -= 1;
        }
        _mapTokenIdToNFTItem[tokenId].isForSale = changeToIsForSale;
        emit SaleStatusChanged(item, changeToIsForSale, newPrice);
    }

    // Get All NFT Items for Sale: All NFTs in the contract that are for sale
    function getItemsForSale() public view returns (NFTItem[] memory) {
        NFTItem[] memory itemsForSale = new NFTItem[](_numberOfItemsForSale);
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.isForSale) {
                nftItem.tokenURI = tokenURI(nftItem.tokenId);
                itemsForSale[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsForSale;
    }

    // Get NFT Item by tokenId
    function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
        NFTItem memory item = _mapTokenIdToNFTItem[tokenId];
        item.tokenURI = tokenURI(item.tokenId);
        return item;
    }

    // 1 = All Items Created By User
    // 2 = All Items Currently Owned By User
    // 3 = All Items For Sale By User
    // 4 =  All Items Not For Sale By User
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
                ? _mapOwnerToTokenIdOfItemsSold[user].length
                : _mapOwnerToItemsCreatedCount[user]
        );

        if (kind == 5) {
            uint256[] memory _itemsSoldTokenIds = _mapOwnerToTokenIdOfItemsSold[
                user
            ];
            for (uint256 i = 0; i < _itemsSoldTokenIds.length; i++) {
                items[i] = _mapTokenIdToNFTItem[_itemsSoldTokenIds[i]];
            }
            return items;
        }

        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            nftItem.tokenURI = tokenURI(nftItem.tokenId);
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
            _mapOwnerToTokenIdOfItemsSold[userAddress].length // Total NFT Items Sold,
        ];
    }

    function isTokenBurned(uint256 tokenId) public view returns (bool) {
        return _mapIsTokenBurned[tokenId];
    }

    // Get chain id of contract
    function getChainID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    // Change Service Charge: Only for admin
    // Should sent percentage value like if 5% => 5000
    function changeServiceCharge(uint256 newSc) public onlyOwner {
        require(newSc < 100000);
        serviceCharge = newSc;
        emit ServiceChargeChanged(newSc, serviceCharge);
    }

    // Change Service Charge: Only for admin
    // Should sent percentage value
    function changeBaseURI(string memory uri) public onlyOwner {
        string memory oldURI = baseURI;
        baseURI = uri;
        emit BaseURIChanged(uri, oldURI);
    }

    // Verifies the signature for a given NFTVoucher, returning the address of the signer.
    // This call may not revert if the signature is invalid, or if the signer is otherwise unable to be retrieved. In those scenarios, the zero address is returned. So make sure to do require check after addreess is returned from this function
    function verifyVoucher(NFTVoucher calldata voucher)
        public
        view
        returns (address)
    {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    V_HASH,
                    voucher.tokenId,
                    keccak256(bytes(voucher.tokenURI)),
                    voucher.price,
                    voucher.isForSale,
                    voucher.isAuction,
                    voucher.target,
                    voucher.isRedeem,
                    voucher.startDate,
                    voucher.endDate
                )
            )
        );
        return ECDSA.recover(digest, voucher.signature);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        NFTItem memory item = _mapTokenIdToNFTItem[tokenId];
        return
            bytes(item.tokenURI).length > 0
                ? string(abi.encodePacked(baseURI, item.tokenURI))
                : "";
    }

    function _createNFTItem(
        uint256 tokenId,
        string memory tokenURI_,
        uint256 price,
        bool isForSale,
        address creator
    ) private {
        require(price > 0); // INVALID_PRICE
        _mapTokenIdToNFTItem[tokenId] = NFTItem(
            tokenId,
            tokenURI_,
            price,
            creator,
            msg.sender,
            isForSale
        );
        _numberOfItems += 1;
        _mapOwnerToItemsCreatedCount[creator] += 1;
        if (isForSale) {
            _numberOfItemsForSale += 1;
            _mapOwnerToItemsForSaleCount[msg.sender] += 1;
        }
    }

    function _removeNFT(uint256 tokenId) private returns (NFTItem memory) {
        NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
        delete _mapTokenIdToNFTItem[tokenId];
        _numberOfItems -= 1;
        _mapOwnerToItemsCreatedCount[nftItem.creator] -= 1;
        if (nftItem.isForSale) {
            _numberOfItemsForSale -= 1;
            _mapOwnerToItemsForSaleCount[nftItem.owner] += 1;
        }
        return nftItem;
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
