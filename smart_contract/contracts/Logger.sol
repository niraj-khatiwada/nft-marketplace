// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

abstract contract Logger {
    function logEvent() public pure virtual returns (bytes32);
}
