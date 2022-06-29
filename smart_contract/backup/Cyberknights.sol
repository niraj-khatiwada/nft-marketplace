// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract CyberKnights is ERC721Enumerable, Ownable {
    using Strings for uint256;

    // VARIABLES
    string public baseURI;
    string public baseExtension = ".json";
    string public notRevealedUri;
    address public hotWallet;

    uint256 public maxSupply = 10000;

    // BOOLs AFTER PRE-SALE
    uint256 public cost; // COST AFTER PRE-SALE
    uint256 public availableMaxSupplyAfterPreSale = 7000; // MAX SUPPLY AFTER PRE-SALE

    // BOOLs FOR PRE-SALE
    uint256 public preSaleCost; // COST ON PRE-SALE
    uint256 public availableMaxSupplyOnPresale = 3000; // MAX SUPPLY ON PRE-SALE
    bool public onPresale = true; // THE PRE-SALE STARTED?
    uint256 public minDvxAmount; // MIN DVX AMOUNT TO HOLD IN ORDER TO MINT

    bool public pause = true;

    // BOOL REVEAL
    bool public revealed = false; // THE NFTs ARE REVEALED?

    // MAPPINGS
    mapping(address => bool) public blacklist; // THE ADDRESS IS BLACKLISTED?
    mapping(uint256 => bool) public allowNftTransfer;

    // CONSTRUCTOR
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _initNotRevealedUri,
        address _hotWallet
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);
        setNotRevealedURI(_initNotRevealedUri);
        hotWallet = _hotWallet;
        _mint(msg.sender, 1);
        allowNftTransfer[1] = true;
    }

    // INTERNAL FUNCTIONS
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // MINT FUNCTION
    function mint(address _to, uint256 _mintAmount) public payable {
        require(pause == false, "The contract is paused!"); //  IS THE CONTRACT PAUSED
        require(blacklist[msg.sender] == false, "The address is blacklisted!"); // THE ADDRESS SHOULD NOT BE BLACKLISTED

        uint256 supply = totalSupply(); // GET THE TOTAL SUPPLY

        require(_mintAmount > 0); // YOU NEED TO MINT AT LEAST 1 NFT
        require(supply + _mintAmount <= maxSupply, "No more NFTs to mint!"); // CHECK IF THE CURRENT SUPPLY + TO-BE-MINTED AMOUNT IS SMALLER THAN MAX SUPPLY

        // IS PRE-SALE OPEN?
        if (onPresale == true) {
            availableMaxSupplyOnPresale =
                availableMaxSupplyOnPresale -
                _mintAmount; // CALCULATE THE AVAILABLE SUPPLY
            require(
                availableMaxSupplyOnPresale >= 0,
                "The max supply for pre-sale was reached!"
            ); // CHECK IF THERE ARE ANY NFTs LEFT TO BE MINTED

            if (msg.sender != owner() && msg.sender != hotWallet) {
                // IS THE CALLER THE OWNER OF THE SMART CONTRACT?
                require(msg.value >= preSaleCost * _mintAmount); // FEE FOR MINTING = PRE-SALE COST * AMOUNT TO BE MINTED
            }

            for (uint256 i = 1; i <= _mintAmount; i++) {
                allowNftTransfer[supply + i] = true;
                _safeMint(_to, supply + i);
            }
        } else {
            // EXECUTE AFTER THE CONTRACT IS NOT ON PRE-SALE ANYMORE
            availableMaxSupplyAfterPreSale =
                availableMaxSupplyAfterPreSale -
                _mintAmount; // CHECK THE AVAILABLE SUPPLY AFTER PRE-SALE
            require(
                availableMaxSupplyAfterPreSale >= 0,
                "The max supply was reached!"
            ); // CHECK IF THERE ARE ANY NFTs LEFT TO BE MINTED

            if (msg.sender != owner() && msg.sender != hotWallet) {
                require(msg.value >= cost * _mintAmount); // FEE FOR MINTING = NORMAL COST * AMOUNT TO BE MINTED
            }

            for (uint256 i = 1; i <= _mintAmount; i++) {
                allowNftTransfer[supply + i] = true;
                _safeMint(_to, supply + i);
            }
        }
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (revealed == false) {
            return notRevealedUri;
        }

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(
                    abi.encodePacked(
                        currentBaseURI,
                        tokenId.toString(),
                        baseExtension
                    )
                )
                : "";
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(
            blacklist[from] == false || from == address(0),
            "You are blacklisted!"
        );
        require(
            pause == false || from == address(0),
            "The transfer function is paused!"
        );
        require(
            allowNftTransfer[tokenId] == true || from == address(0),
            "Please allow the transfer of your NFT!"
        );

        super._transfer(from, to, tokenId);
    }

    // REVEAL
    function reveal() public onlyOwner {
        revealed = true;
    }

    // PRE-SALE SETTINGS
    function setMinDvxAmount(uint256 _minDvxAmount) public onlyOwner {
        minDvxAmount = _minDvxAmount;
    }

    function startPreSale(bool _onPresale) public onlyOwner {
        onPresale = _onPresale;
    }

    function setAfterPresaleSupply(uint256 _availableMaxSupplyAfterPreSale)
        public
        onlyOwner
    {
        availableMaxSupplyAfterPreSale = _availableMaxSupplyAfterPreSale;
    }

    function setOnPresaleSupply(uint256 _availableMaxSupplyOnPresale)
        public
        onlyOwner
    {
        availableMaxSupplyOnPresale = _availableMaxSupplyOnPresale;
    }

    function setPreSaleCost(uint256 _preSaleCost) public onlyOwner {
        preSaleCost = _preSaleCost;
    }

    // SETTERS
    function pauseTheSmartContract(bool _pause) public onlyOwner {
        pause = _pause;
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }

    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension)
        public
        onlyOwner
    {
        baseExtension = _newBaseExtension;
    }

    function setBlacklistedAddress(address _who, bool _isBlacklisted)
        public
        onlyOwner
    {
        blacklist[_who] = _isBlacklisted;
    }

    function setStatusOfNFT(uint256 _tokenId, bool _status) external {
        require(
            ERC721.ownerOf(_tokenId) == msg.sender,
            "You are not the owner of this NFT!"
        );
        allowNftTransfer[_tokenId] = _status;
    }

    function setHotWallet(address _hotWallet) external onlyOwner {
        require(_hotWallet != address(0), "ZERO address");
        hotWallet = _hotWallet;
    }

    function withdrawMatic() external onlyOwner {
        uint256 balance = payable(address(this)).balance;
        payable(address(owner())).transfer(balance);
    }
}
