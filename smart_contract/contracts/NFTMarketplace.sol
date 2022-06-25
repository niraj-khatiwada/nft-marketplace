// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "./Admin.sol";

contract NFTMarketplace is ERC721URIStorage, Admin {
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

    uint256[] private _nftItems;

    mapping(string => bool) private _doesTokenURIExistsMapping;
    mapping(uint256 => NFTItem) private _mapTokenIdToNFTItem;
    mapping(uint256 => uint256) private _mapTokenIdToNFTItemIndex;

    Counters.Counter private _numberOfItems;
    Counters.Counter private _numberOfItemsForSale;

    constructor() ERC721("Xungible NFT", "XNFT") {}

    receive() external payable {}

    event NFTItemCreated(NFTItem nftItem);
    event ItemListingPriceChanged(uint256 newPrice);
    event NFTItemPurchased(NFTItem nftItem, address purchasedBy);

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

    function buyNFT(uint256 tokenId) external payable {
        address itemOwner = ERC721.ownerOf(tokenId);
        require(
            msg.sender != itemOwner,
            "YOU_ARE_NFT_OWNER|You already owne this NFT Item."
        );
        NFTItem memory nftItem = _mapTokenIdToNFTItem[tokenId];
        uint256 itemPrice = nftItem.price;
        require(
            itemPrice != msg.value,
            "PRICE_MISTMATCH|Your price does not match the listed price."
        );

        nftItem.isForSale = false;
        nftItem.owner = msg.sender;
        _numberOfItemsForSale.decrement();

        _transfer(itemOwner, msg.sender, tokenId);
        payable(itemOwner).transfer(itemPrice);

        emit NFTItemPurchased(nftItem, msg.sender);
    }

    function getNFTTokenIdFromIndex(uint256 index)
        public
        view
        returns (uint256)
    {
        require(index < _nftItems.length, "Index out of range.");
        return _nftItems[index];
    }

    function getNFTItemsForSale() public view returns (NFTItem[] memory) {
        NFTItem[] memory itemsForSale = new NFTItem[](_numberOfItems.current());

        for (uint256 i; i < _numberOfItems.current(); i++) {
            uint256 nftItemTokenId = getNFTTokenIdFromIndex(i);
            NFTItem memory nftItem = _mapTokenIdToNFTItem[nftItemTokenId];
            if (nftItem.isForSale) {
                itemsForSale[i] = nftItem;
            }
        }
        return itemsForSale;
    }

    function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
        return _mapTokenIdToNFTItem[tokenId];
    }

    function getNFTItemsCount() public view returns (uint256) {
        return _numberOfItems.current();
    }

    function getNFTItemsForSaleCount() public view returns (uint256) {
        return _numberOfItemsForSale.current();
    }

    function doesTokenURIExists(string memory tokenURI)
        public
        view
        returns (bool)
    {
        return _doesTokenURIExistsMapping[tokenURI];
    }

    function changeListingPrice(uint256 newPrice) external payable onlyAdmin {
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
        _numberOfItems.increment();
        _numberOfItemsForSale.increment();
        _doesTokenURIExistsMapping[tokenURI] = true;
        emit NFTItemCreated(newNFTItem);
        return newNFTItem;
    }

    function _addTokenToAllTokens(uint256 tokenId) private {
        _mapTokenIdToNFTItemIndex[tokenId] = _nftItems.length;
        _nftItems.push(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (from == address(0)) {
            _addTokenToAllTokens(tokenId);
        }
    }
}
