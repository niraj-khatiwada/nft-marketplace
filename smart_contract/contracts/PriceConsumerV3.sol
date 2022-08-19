// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeedETH;
    AggregatorV3Interface internal priceFeedMATIC;

    /*
    Ethereum Mainnet => ETH / USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419

    Rinkeby Testnet =>ETH / USD:  0x8A753747A1Fa494EC906cE90E9f37563A8AF630e

    Polygon Mainnet => MATIC/USD: 0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676

    Polygon Mumbai Testnet: MATIC/USD: 0x7794ee502922e2b723432DDD852B3C30A911F021

    More info:
    https://docs.chain.link/docs/ethereum-addresses/

    */

    constructor() {
        priceFeedETH = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );
        priceFeedMATIC = AggregatorV3Interface(
            0x7794ee502922e2b723432DDD852B3C30A911F021
        );
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int256[2] memory) {
        (, int256 priceETH, , , ) = priceFeedETH.latestRoundData();
        (, int256 priceMATIC, , , ) = priceFeedMATIC.latestRoundData();
        return [priceETH, priceMATIC];
    }
}
