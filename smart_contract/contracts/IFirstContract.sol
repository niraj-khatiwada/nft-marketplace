// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IFirstContract {
    function transferOwnership(address newAddress)
        external
        payable
        returns (address);
}
