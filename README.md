# momentaContractsTesting

## Installation

`npm i`

## Compile/build contracts

`npm run build`

## Run unit-test

- Run all: `npm run test`
- Run coverage: `npm run test-coverage`
- Run only DbiliaToken test: `npm run test-token`
- Run only Marketplace test: `npm run test-marketplace`
- Run only WethReceiver test: `npm run test-wethreceiver`

## Deployment

Edit/check the private keys of CEO and DbiliaTrust accounts in file `hardhat.config.js`
specified via the param `DBILIA_WALLET_PRIVATE_KEY_CEO` and `DBILIA_WALLET_PRIVATE_KEY_DBILIA`

- Deploy to Matic testnet: `npm run deploy-matictestnet`
- Deploy to Matic mainnet: `npm run deploy-maticmainnet`
- Deploy to hardhat: `npm run deploy-hardhat`

## Deployment of only WethReceiver contract

- Deploy to Matic testnet: `npm run deploy-weth-receiver-matictestnet`
- Deploy to Matic mainnet: `npm run deploy-weth-receiver-maticmainnet`
- Deploy to hardhat: `npm run deploy-weth-receiver-hardhat`

## Verify

- DbiliaToken contract:

`npx hardhat verify --constructor-args deploy_args_dbiliatoken.js --network matictestnet 0xaAeEeaDCCF81db8F50cDE7443F9025F105957380`

- Marketplace contract:

`npx hardhat verify --constructor-args deploy_args_marketplace.js --network matictestnet 0xe8CD0ea161e9eBf74747ab1FA8f5462C9De01F10`

## Matic network

### Faucet

This faucet provides both test `MATIC` tokens on Matic testnet and test `ETH` tokens on Goerli
https://faucet.matic.network/

## Metamask connection to Matic

To connect Metamask to Matic, please set the `Custom RPC` with the following info:

- `Network Name`: `Matic Mumbai Testnet` or `Matic Mainnet`
- `New RPC URL`: `https://rpc-mumbai.maticvigil.com` (testnet) or `https://rpc-mainnet.maticvigil.com` (mainnet)
- `Chain ID`: `80001` (testnet) or `137` (mainnet)
- `Currency symbol`: `MATIC`
- `Block explorer URL`: `https://mumbai.polygonscan.com/` (testnet) or `https://polygonscan.com/` (mainnet)