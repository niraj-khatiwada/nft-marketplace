// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

contract Owner {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Permission denied.");
        _;
    }
}
