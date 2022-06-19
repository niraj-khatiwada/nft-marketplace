// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./Owner.sol";
import "./Logger.sol";
import "./IFirstContract.sol";

contract FirstContract is Owner, Logger, IFirstContract {
    uint256 private index;
    mapping(address => bool) private addresses;
    mapping(uint256 => address) private adressIndexLookup;

    modifier limitWithdraw(uint256 withdrawAmount) {
        require(withdrawAmount <= 1e18, "Cannot withdraw more than 1eth.");
        _;
    }

    function logEvent() public pure override returns (bytes32) {
        return "Hello World";
    }

    function transferOwnership(address newOwner)
        external
        payable
        onlyOwner
        returns (address)
    {
        require(
            msg.sender != newOwner,
            "The new owner supplied is the current owner."
        );
        owner = newOwner;
        return newOwner;
    }

    function storeAddress() external payable {
        require(!addresses[msg.sender], "Address already exists");
        addresses[msg.sender] = true;
        adressIndexLookup[index] = msg.sender;
        index++;
    }

    function getAddresses() external view returns (address[] memory) {
        address[] memory _addresses = new address[](index);

        for (uint256 i = 0; i < index; i++) {
            _addresses[i] = adressIndexLookup[i];
        }
        return _addresses;
    }

    function withdrawFunds(uint256 amount) external limitWithdraw(amount) {
        // require(amount <= 1e18, "Cannot withdraw more than 1eth.");
        payable(msg.sender).transfer(amount);
    }

    // receive() external payable {}

    // function addFunds(uint256 amount) external payable {}
}
