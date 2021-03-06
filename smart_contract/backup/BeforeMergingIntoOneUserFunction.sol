// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    struct NFTItem {
        uint256 tokenId;
        string tokenURI;
        uint256 price;
        address creator;
        address owner;
        bool isForSale;
    }

    uint256 public serviceCharge = 5000; // 5% by default. 1000 -> 1%

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

    Counters.Counter private _numberOfItems; // Does not keep track of burned tokens
    Counters.Counter private _numberOfItemsForSale; // Keep track of active number of items on sale

    constructor() ERC721("Xungible NFT", "XNFT") {}

    receive() external payable {}

    function withdrawBalance(uint256 amount) external payable onlyOwner {
        require(amount <= address(this).balance); //NOT_ENOUGH_BALANCE
        payable(msg.sender).transfer(address(this).balance);
    }

    function mintToken(
        uint256 tokenId,
        string memory tokenURI,
        uint256 price,
        bool isForSale
    ) public payable {
        require(!_doesTokenURIExistsMapping[tokenURI]); //URI_ALREADY_EXISTS

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _createNFTItem(tokenId, tokenURI, price, isForSale);
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
        _numberOfItemsForSale.decrement();
        _mapOwnerToItemsSoldCount[ownerAddress] += 1;
        _mapTokenIdToNFTItem[tokenId].owner = msg.sender;

        _transfer(ownerAddress, msg.sender, tokenId);
        payable(ownerAddress).transfer(
            msg.value - ((msg.value * serviceCharge) / (100000))
        );
    }

    function burnToken(uint256 tokenId) public payable {
        require(msg.sender == ERC721.ownerOf(tokenId)); // NOT_THE_NFT_OWNER
        _burn(tokenId);
        _removeNFT(tokenId);
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
            _numberOfItemsForSale.increment();
        } else {
            _mapOwnerToItemsForSaleCount[ERC721.ownerOf(tokenId)] -= 1;
            _numberOfItemsForSale.decrement();
        }
        _mapTokenIdToNFTItem[tokenId].isForSale = changeToIsForSale;
    }

    // Get All NFT Items for Sale: All NFTs in the contract that are for sale
    function getItemsForSale() public view returns (NFTItem[] memory) {
        NFTItem[] memory itemsForSale = new NFTItem[](
            _numberOfItemsForSale.current()
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.isForSale) {
                itemsForSale[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsForSale;
    }

    // Get NFT Item by tokenId
    function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
        return _mapTokenIdToNFTItem[tokenId];
    }

    // Get All NFT Items by particular creator: All NFTs in the contract created by a user
    function getItemsByCreator(address creator)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory allNftItemsByCreator = new NFTItem[](
            _mapOwnerToItemsCreatedCount[creator]
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.creator == creator) {
                allNftItemsByCreator[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return allNftItemsByCreator;
    }

    // Get All NFT Items by particular owner: NFT owned by a user (Sale + Not For Sale)
    function getItemsByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory allNftItemsByOwner = new NFTItem[](
            ERC721.balanceOf(owner)
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.owner == owner) {
                allNftItemsByOwner[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return allNftItemsByOwner;
    }

    // Get All NFT Items sold by a particular owner: All NFTs in the contract sold by a user
    function getItemsSoldByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory itemsSoldByOwner = new NFTItem[](
            _mapOwnerToItemsSoldCount[owner]
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _nftItems.length; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.creator == owner && nftItem.owner != owner) {
                itemsSoldByOwner[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsSoldByOwner;
    }

    // Get All NFT Items for sale by particular user: All NFTs in the contract by a user that are for sale
    function getItemsForSaleByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory itemsForSaleByOwner = new NFTItem[](
            _mapOwnerToItemsForSaleCount[owner]
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _nftItems.length; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.owner == owner && nftItem.isForSale) {
                itemsForSaleByOwner[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsForSaleByOwner;
    }

    // Get All NFT Items  not for sale by particular user: All NFTs in the contract by a user that are not for sale
    function getItemsNotForSaleByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory itemsForSaleByOwner = new NFTItem[](
            ERC721.balanceOf(owner) - _mapOwnerToItemsForSaleCount[owner]
        );
        uint256 currentIndex;
        for (uint256 i = 0; i < _nftItems.length; i++) {
            NFTItem memory nftItem = _mapTokenIdToNFTItem[_nftItems[i]];
            if (nftItem.owner == owner && !nftItem.isForSale) {
                itemsForSaleByOwner[currentIndex] = nftItem;
                currentIndex++;
            }
        }
        return itemsForSaleByOwner;
    }

    // Ge the user nft details count in one function
    function getNFTItemCountUtilityByUser(address userAddress)
        public
        view
        returns (uint256[5] memory)
    {
        return [
            _mapOwnerToItemsCreatedCount[userAddress], // Total NFT Items Created
            ERC721.balanceOf(userAddress), // Total NFT Items Owned
            _mapOwnerToItemsForSaleCount[userAddress], // Total NFT Items Owned for sale
            ERC721.balanceOf(userAddress) -
                _mapOwnerToItemsForSaleCount[userAddress], // Total NFT Items owned not for sale
            _mapOwnerToItemsSoldCount[userAddress] // Total NFT Items Sold,
        ];
    }

    // Change Service Charge: Only for admin
    // Should sent percentage value
    function changeServiceCharge(uint256 newSc) external payable onlyOwner {
        require(newSc < 100000);
        serviceCharge = newSc;
    }

    function _createNFTItem(
        uint256 tokenId,
        string memory tokenURI,
        uint256 price,
        bool isForSale
    ) private {
        require(price > 0); // INVALID_PRICE
        _mapTokenIdToNFTItem[tokenId] = NFTItem(
            tokenId,
            tokenURI,
            price,
            msg.sender,
            msg.sender,
            isForSale
        );
        _doesTokenURIExistsMapping[tokenURI] = true;
        _numberOfItems.increment();
        _mapOwnerToItemsCreatedCount[msg.sender] += 1;
        if (isForSale) {
            _numberOfItemsForSale.increment();
            _mapOwnerToItemsForSaleCount[msg.sender] += 1;
        }
    }

    function _removeNFT(uint256 tokenId) private {
        NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
        delete _doesTokenURIExistsMapping[nftItem.tokenURI];
        delete _mapTokenIdToNFTItem[tokenId];
        _numberOfItems.decrement();
        _mapOwnerToItemsCreatedCount[msg.sender] -= 1;
        if (nftItem.isForSale) {
            _numberOfItemsForSale.decrement();
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
