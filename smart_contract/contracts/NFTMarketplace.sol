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
    uint256 public itemListingPrice = 250000000000000; // 0.00025 Ether by default

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

    Counters.Counter private _globalNumberOfItems; // This will keep track of all the item created regardless of it was burned/transferred etc.
    Counters.Counter private _numberOfItems; // Does not keep track of burned tokens
    Counters.Counter private _numberOfItemsForSale; // Keep track of active number of items on sale

    constructor() ERC721("Xungible NFT", "XNFT") {}

    event NFTItemCreated(NFTItem nftItem);
    event ItemListingPriceChanged(uint256 newPrice);
    event NFTItemPurchased(NFTItem nftItem, address purchasedBy);
    event NFTItemRemoved(NFTItem nftItem);
    event BalanceWithdrawed(address by, uint256 balance);

    function getBalance() public view returns (uint256) {
        return payable(address(this)).balance;
    }

    function withdrawBalance(uint256 amount) external payable onlyOwner {
        uint256 currentBalance = address(this).balance;
        require(
            amount <= currentBalance,
            "NOT_ENOUGH_BALANCE_TO_WITHDRAW|There is not enough balance to withdraw this amount."
        );
        payable(msg.sender).transfer(currentBalance);
        emit BalanceWithdrawed(msg.sender, currentBalance);
    }

    function mintToken(
        uint256 tokenId,
        string memory tokenURI,
        uint256 price
    ) public payable {
        require(
            !doesTokenURIExists(tokenURI),
            "TOKEN_URI_ALREADY_EXISTS|Token URI already exists."
        );
        require(
            itemListingPrice == msg.value,
            "LISTING_PRICE_MISMATCH|Listing price mismatch."
        );
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _createNFTItem(tokenId, tokenURI, price);
    }

    function buyNFT(uint256 tokenId) public payable {
        address itemOwner = ERC721.ownerOf(tokenId);
        require(
            msg.sender != itemOwner,
            "YOU_ARE_NFT_OWNER|You already own this NFT Item."
        );
        require(
            msg.value == _mapTokenIdToNFTItem[tokenId].price,
            "PRICE_MISTMATCH|Your price does not match the listed price."
        );
        _mapOwnerToItemsForSaleCount[itemOwner] =
            _mapOwnerToItemsForSaleCount[itemOwner] -
            1;
        _mapTokenIdToNFTItem[tokenId].isForSale = false;
        _numberOfItemsForSale.decrement();
        _mapOwnerToItemsSoldCount[itemOwner] =
            _mapOwnerToItemsSoldCount[itemOwner] +
            1;
        _mapTokenIdToNFTItem[tokenId].owner = msg.sender;

        _transfer(itemOwner, msg.sender, tokenId);
        payable(itemOwner).transfer(msg.value);

        emit NFTItemPurchased(_mapTokenIdToNFTItem[tokenId], msg.sender);
    }

    function burnToken(uint256 tokenId) public payable {
        address itemOwner = ERC721.ownerOf(tokenId);
        require(
            msg.sender == itemOwner,
            "YOU_ARE_NOT_THE_NFT_OWNER|You don't own this NFT Item."
        );
        _burn(tokenId);
        _removeNFT(tokenId);
    }

    function placeNFTOnSale(uint256 tokenId, uint256 newPrice) public payable {
        address itemOwner = ERC721.ownerOf(tokenId);
        require(
            msg.sender == itemOwner,
            "YOU_ARE_NOT_THE_NFT_OWNER|You don't own this NFT Item."
        );
        require(
            _mapTokenIdToNFTItem[tokenId].isForSale == true,
            "NFT_ITEM_ALREADY_ON_SALE|NFT Item is already on sale."
        );
        require(
            itemListingPrice == msg.value,
            "LISTING_PRICE_MISMATCH|Listing price mismatch."
        );

        _mapTokenIdToNFTItem[tokenId].isForSale == true;
        _mapTokenIdToNFTItem[tokenId].price = newPrice;
        _numberOfItemsForSale.increment();
        _mapOwnerToItemsForSaleCount[itemOwner] =
            _mapOwnerToItemsForSaleCount[itemOwner] +
            1;
    }

    // Get All NFT Items: All NFTs in the contract
    function getAllNFTItems() public view returns (NFTItem[] memory) {
        NFTItem[] memory allNftItems = new NFTItem[](_numberOfItems.current());

        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            uint256 nftItemTokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[nftItemTokenId];
            allNftItems[i] = nftItem;
        }
        return allNftItems;
    }

    // Get All NFT Items by particular creator: All NFTs in the contract created by a user
    function getAllNFTItemsByCreator(address creator)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory allNftItemsByCreator = new NFTItem[](
            _mapOwnerToItemsCreatedCount[creator]
        );

        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            uint256 nftItemTokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[nftItemTokenId];
            if (nftItem.creator == creator) {
                allNftItemsByCreator[i] = nftItem;
            }
        }
        return allNftItemsByCreator;
    }

    // Get All NFT Items by particular owner: NFT owned by a user
    function getAllNFTItemsByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        NFTItem[] memory allNftItemsByOwner = new NFTItem[](
            ERC721.balanceOf(owner)
        );

        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            uint256 nftItemTokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[nftItemTokenId];
            if (nftItem.owner == owner) {
                allNftItemsByOwner[i] = nftItem;
            }
        }
        return allNftItemsByOwner;
    }

    // Get All NFT Items for Sale: All NFTs in the contarct that are for sale
    function getNFTItemsForSale() public view returns (NFTItem[] memory) {
        NFTItem[] memory itemsForSale = new NFTItem[](
            _numberOfItemsForSale.current()
        );

        for (uint256 i = 0; i < _numberOfItems.current(); i++) {
            uint256 nftItemTokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[nftItemTokenId];
            if (nftItem.isForSale == true) {
                itemsForSale[i] = nftItem;
            }
        }
        return itemsForSale;
    }

    // Get All NFT Items sold by a particular owner: All NFTs in the contract sold by a user
    function getNFTItemsSoldByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        uint256 soldTokensLength = _mapOwnerToItemsSoldCount[owner];
        NFTItem[] memory itemsSoldByOwner = new NFTItem[](soldTokensLength);

        for (uint256 i = 0; i < _nftItems.length; i++) {
            uint256 tokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
            if (nftItem.owner == owner && nftItem.isForSale == true) {
                itemsSoldByOwner[i] = nftItem;
            }
        }
        return itemsSoldByOwner;
    }

    // Get All NFT Items sold by particular user: All NFTs in the contract by a user that are already sold
    function getNFTItemsForSaleByOwner(address owner)
        public
        view
        returns (NFTItem[] memory)
    {
        uint256 ownedTokensForSaleLength = _mapOwnerToItemsForSaleCount[owner];
        NFTItem[] memory itemsForSaleByOwner = new NFTItem[](
            ownedTokensForSaleLength
        );
        for (uint256 i = 0; i < _nftItems.length; i++) {
            uint256 tokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
            if (nftItem.owner == owner && nftItem.isForSale == true) {
                itemsForSaleByOwner[i] = nftItem;
            }
        }
        return itemsForSaleByOwner;
    }

    // Get NFT Item by tokenId
    function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
        return _mapTokenIdToNFTItem[tokenId];
    }

    // Get count of all NFT available on the contract
    function getNFTItemsCount() public view returns (uint256) {
        return _numberOfItems.current();
    }

    // Get count of all NFT available for sale only on the contract
    function getNFTItemsForSaleCount() public view returns (uint256) {
        return _numberOfItemsForSale.current();
    }

    // Get count of all NFT available by particular creator
    function getNFTItemsCountByCreator(address creator)
        public
        view
        returns (uint256)
    {
        return _mapOwnerToItemsCreatedCount[creator];
    }

    // Get count of all NFT available(Sale + Not for sale) by particular owner
    function getNFTItemsCountByOwner(address owner)
        public
        view
        returns (uint256)
    {
        return ERC721.balanceOf(owner);
    }

    // Get count of all NFT available for sale only by particular owner
    function getNFTItemsForSaleCountByOwner(address owner)
        public
        view
        returns (uint256)
    {
        return _mapOwnerToItemsForSaleCount[owner];
    }

    // Get count of all NFT available sold only by particular user
    function getNFTItemsSoldCountByOwner(address owner)
        public
        view
        returns (uint256)
    {
        return _mapOwnerToItemsSoldCount[owner];
    }

    function getNFTTokenIdFromIndex(uint256 index)
        public
        view
        returns (uint256)
    {
        require(index < _nftItems.length, "Index out of range.");
        return _nftItems[index];
    }

    function doesTokenURIExists(string memory tokenURI)
        public
        view
        returns (bool)
    {
        return _doesTokenURIExistsMapping[tokenURI];
    }

    // Change Listing Price: Only for admin
    // Should sent wei value
    function changeListingPrice(uint256 newPrice) external payable onlyOwner {
        require(
            itemListingPrice != newPrice,
            "New Price is same as the old price."
        );
        itemListingPrice = newPrice;
        emit ItemListingPriceChanged(newPrice);
    }

    function _createNFTItem(
        uint256 tokenId,
        string memory tokenURI,
        uint256 price
    ) private returns (NFTItem memory) {
        require(price > 0, "INVALID_PRICE|Price must be greater than 0.");
        NFTItem memory newNFTItem = NFTItem(
            tokenId,
            tokenURI,
            price,
            msg.sender,
            msg.sender,
            true
        );
        _mapTokenIdToNFTItem[tokenId] = newNFTItem;
        _doesTokenURIExistsMapping[tokenURI] = true;
        _numberOfItems.increment();
        _globalNumberOfItems.increment();
        _numberOfItemsForSale.increment();
        _mapOwnerToItemsForSaleCount[msg.sender] =
            _mapOwnerToItemsForSaleCount[msg.sender] +
            1;
        _mapOwnerToItemsCreatedCount[msg.sender] =
            _mapOwnerToItemsCreatedCount[msg.sender] +
            1;
        emit NFTItemCreated(newNFTItem);
        return newNFTItem;
    }

    function _removeNFT(uint256 tokenId) private returns (NFTItem memory) {
        NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
        delete _doesTokenURIExistsMapping[nftItem.tokenURI];
        delete _mapTokenIdToNFTItem[tokenId];
        _numberOfItems.decrement();
        _mapOwnerToItemsCreatedCount[msg.sender] =
            _mapOwnerToItemsCreatedCount[msg.sender] -
            1;
        if (nftItem.isForSale) {
            _numberOfItemsForSale.decrement();
            _mapOwnerToItemsForSaleCount[msg.sender] =
                _mapOwnerToItemsForSaleCount[msg.sender] -
                1;
        }
        emit NFTItemRemoved(nftItem);
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
        uint256 lastTokenIndex = _nftItems.length - 1;
        uint256 tokenIndex = _mapTokenIdToNFTItemIndex[tokenId];

        uint256 lastTokenId = _nftItems[lastTokenIndex];

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
