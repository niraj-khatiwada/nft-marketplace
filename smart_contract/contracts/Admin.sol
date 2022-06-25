// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

contract Admin {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "PERMISSION_DENIED|Only allowed to admin."
        );
        _;
    }

    modifier notAdmin() {
        require(msg.sender != admin, "PERMISSION_DENIED|Admin not allowed.");
        _;
    }
}
