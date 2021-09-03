// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
  AggregatorV3Interface internal priceFeed;

  int256 private ethUsdPriceFake = 2000 * 10 ** 8; // remember to multiply by 10 ** 8

  /**
   * Network: Kovan
   * Aggregator: ETH/USD
   * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
   */
  constructor() {
    // Ethereum mainnet
    if (block.chainid == 1) {
      priceFeed = AggregatorV3Interface(
        0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
      );
    } else if (block.chainid == 42) {
      // Kovan
      priceFeed = AggregatorV3Interface(
        0x9326BFA02ADD2366b30bacB125260Af641031331
      );
    } else if (block.chainid == 5) {
      // Goerli priceFeed is not available and thus take it from Kovan
      priceFeed = AggregatorV3Interface(
        0x9326BFA02ADD2366b30bacB125260Af641031331
      );
    } else if (block.chainid == 137) {
      // Matic mainnet
      priceFeed = AggregatorV3Interface(
        0xF9680D99D6C9589e2a93a78A04A279e509205945
      );
    } else if (block.chainid == 80001) {
      // Matic testnet
      priceFeed = AggregatorV3Interface(
        0x0715A7794a1dc8e42615F059dD6e406A6594651A
      );
    } else {
      // Unit-test and thus take it from Kovan
      priceFeed = AggregatorV3Interface(
        0x9326BFA02ADD2366b30bacB125260Af641031331
      );
    }
  }

  /**
   * Returns the latest price
   */
  function getThePrice() public view returns (int256) {
    if (
      block.chainid == 1 ||
      block.chainid == 42 ||
      block.chainid == 137 ||
      block.chainid == 80001
    ) {
      (, int256 price, , , ) = priceFeed.latestRoundData();
      return price;
    } else {
      return ethUsdPriceFake;
    }
  }
}
