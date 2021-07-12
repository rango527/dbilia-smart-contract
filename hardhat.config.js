require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://kovan.infura.io/v3/ddcd584d6db4474bb74ba884c5c29080",
      }
    },
    kovan: {
      url: "https://kovan.infura.io/v3/ddcd584d6db4474bb74ba884c5c29080",
      accounts: {
        mnemonic: 'd10e9877879747618f82cc41a126bf1f',
      }
    }
  },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 50000
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  }
};

