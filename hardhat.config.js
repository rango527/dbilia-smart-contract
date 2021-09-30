require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// Private keys of CEO and DbiliaTrust accounts on *** Matic testnet ***
const DBILIA_WALLET_PRIVATE_KEY_CEO =
  process.env.DBILIA_WALLET_PRIVATE_KEY_CEO ||
  "baac1aa74a390b135d002b42b93d0e96aca85a2f7eaf00d105d632b1ce130153";

const DBILIA_WALLET_PRIVATE_KEY_DBILIA =
  process.env.DBILIA_WALLET_PRIVATE_KEY_DBILIA ||
  "e91e185ae353dcbd575173d205a0d9162fc04eb1378e2d7d9e2ea6abf46b6487";

const DBILIA_WALLET_PRIVATE_KEY_DBILIA_FEE =
  process.env.DBILIA_WALLET_PRIVATE_KEY_DBILIA_FEE ||
  "e0b238e1a4e6b0bd38de722977884d4fe709fe183a7584cd7282b0985d59f805";

const accounts = [
  DBILIA_WALLET_PRIVATE_KEY_CEO, 
  DBILIA_WALLET_PRIVATE_KEY_DBILIA,
  DBILIA_WALLET_PRIVATE_KEY_DBILIA_FEE
];

// Do not use MNEMONIC
// const accounts = {
//   mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
// }

const INFURA_API_KEY =
  process.env.INFURA_API_KEY || "9a755ff3354b427aaab1837447d93a46";

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
        enabled: process.env.FORKING_ENABLED === "true" ? true : false,
        url: "https://rpc-mumbai.maticvigil.com",
      },
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 1,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts,
      chainId: 5,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
      gasPrice: 5000000000,
      gasMultiplier: 1,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
      accounts,
      chainId: 42,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
      gasPrice: 1000000000,
      gasMultiplier: 1,
    },
    maticmainnet: {
      url: "https://rpc-mainnet.maticvigil.com",
      accounts,
      chainId: 137,
      live: true,
      saveDeployments: true,
    },
    matictestnet: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts,
      chainId: 80001,
      live: true,
      saveDeployments: true,
      tags: ["staging"],
      gasPrice: 1000000000,
      gasMultiplier: 1,
    },
  },
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 50000,
  },
  // This also applies for Matic "verify" used for source code publish
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY || "KVDVZEZNBI415ZSBFNN74RA99U5PUQ6JP9",
  },
};
