// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
  AggregatorV3Interface internal priceFeedEthUsd;
  AggregatorV3Interface internal priceFeedEurUsd;

  int256 private ethUsdPriceFake = 2000 * 10 ** 8; // remember to divide by 10 ** 8

  // 1.181
  int256 private eurUsdPriceFake = 1181 * 10 ** 5; // remember to divide by 10 ** 8

  constructor() {
    // Ethereum mainnet
    if (block.chainid == 1) {
      priceFeedEthUsd = AggregatorV3Interface(
        0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
      );

      priceFeedEurUsd = AggregatorV3Interface(
        0xb49f677943BC038e9857d61E7d053CaA2C1734C1
      );
    } else if (block.chainid == 42) {
      // Kovan
      priceFeedEthUsd = AggregatorV3Interface(
        0x9326BFA02ADD2366b30bacB125260Af641031331
      );

      priceFeedEurUsd = AggregatorV3Interface(
        0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13
      );
    } else if (block.chainid == 5) {
      // Goerli priceFeedEthUsd is not available!!
      // Thus, no need to set "priceFeedEthUsd"
      
      priceFeedEurUsd = AggregatorV3Interface(
        0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13
      );
    } else if (block.chainid == 137) {
      // Matic mainnet
      priceFeedEthUsd = AggregatorV3Interface(
        0xF9680D99D6C9589e2a93a78A04A279e509205945
      );

      priceFeedEurUsd = AggregatorV3Interface(
        0x73366Fe0AA0Ded304479862808e02506FE556a98
      );
    } else if (block.chainid == 80001) {
      // Matic testnet
      priceFeedEthUsd = AggregatorV3Interface(
        0x0715A7794a1dc8e42615F059dD6e406A6594651A
      );

      // Matic testnet priceFeedEurUsd is not available!!
      // Thus, no need to set "priceFeedEurUsd"
      
    } else {
      // Unit-test and thus take it from Kovan
      priceFeedEthUsd = AggregatorV3Interface(
        0x9326BFA02ADD2366b30bacB125260Af641031331
      );

      // Unit-test and thus take it from Matic mainnet
      priceFeedEurUsd = AggregatorV3Interface(
        0x73366Fe0AA0Ded304479862808e02506FE556a98
      );
    }
  }

  /**
   * Returns the latest price of ETH / USD
   */
  function getThePriceEthUsd() public view returns (int256) {
    if (
      block.chainid == 1 ||
      block.chainid == 42 ||
      block.chainid == 137 ||
      block.chainid == 80001
    ) {
      (, int256 price, , , ) = priceFeedEthUsd.latestRoundData();
      return price;
    } else {
      return ethUsdPriceFake;
    }
  }

  /**
   * Returns the latest price of EUR / USD
   */
  function getThePriceEurUsd() public view returns (int256) {
    if (
      block.chainid == 1 ||
      block.chainid == 42 ||
      block.chainid == 137
    ) {
      (, int256 price, , , ) = priceFeedEurUsd.latestRoundData();
      return price;
    } else {
      return eurUsdPriceFake;
    }
  }
}
