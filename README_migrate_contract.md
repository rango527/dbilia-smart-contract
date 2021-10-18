# Data migration of the current DbiliaToken contract to the new one

1. Test script on Matic testnet

  - Implemented in `scripts/migrate_dbiliatoken.js`
    - Input params:
        - `DbiliaTokenContractAddress_current`
        - `productIdEditionList`

  - Test scenario:
    - Reference the current `DbiliaToken` contract
    - Deploy new `DbiliaToken` contract
    - Replicate data of the current `DbiliaToken` contract to the new one

  - Cmd: `yarn migrate-dbiliatoken-matictestnet`

2. Log output

```
contractsTesting$ yarn migrate-dbiliatoken-matictestnet
yarn run v1.22.5
warning package.json: No license field
$ npx hardhat run --network matictestnet scripts/migrate_dbiliatoken.js
Current DbiliaToken contract - address:  0x92ffd3f6C549AC6f9ae5d995F92988a897C8BEa3 , totalSupply:  46
New DbiliaToken contract - address:  0x0b51926ac2f6F955681ef9f5607C0d8334639A64
tokenId:  1
mintForDataMigration - tx:  0x5c61563003b3d814415af6f40753fada1250829dc0bf7d24fa436c4bdbd4edd1
percentage:  10 , receiverId:  60ff07d4ee3991247e6705ca
setRoyaltyReceiver - tx:  0x18cbf5d9aa76762bfa35dfbe3f59e6e7cf9aa03a28319d2690a79c1567cedf02
isW3user:  true , w3owner:  0xA6431D80240C3a3FeF54Dd2179b2BDC13fEec467 , w2owner:  
setTokenOwner - tx:  0xe8e9bcab978a76deeabfc62a5c17fae5a82ac6c5b20feaa964d515db7e8aa473
setProductEditionTokenId - tx:  0xdaee1e3e86741c969c53376329d001b04803d4ce8fa49354410f28e2978ca650
setProductEditionTokenId - tx:  0x11b17c597d15a08f5957cc2f18f1b7b08106d1dbeb27533ed9e6c9b33817eb63
setProductEditionTokenId - tx:  0x725c919a9d7c69e66f052e3f6041a7266892876e11b4e2256e114a6fc0c16c61
tokenId:  2
mintForDataMigration - tx:  0x276dcf2608c30d20fbe3b0f28edffc49973e2e8cd9ed1d99d6cde2e98fda33d6
percentage:  10 , receiverId:  6125ef46b1ed3b0fd44eb4de
setRoyaltyReceiver - tx:  0xb7caf3e5be51d29f736b7e15307c294eb41ead4548bc3c31fdd381fc69113c08
isW3user:  false , w3owner:  0x0000000000000000000000000000000000000000 , w2owner:  611c4489dc5780452caf0232
setTokenOwner - tx:  0x164b1732456b27acedb9e2dd9c588fde7eafa493de951698341d4dc36456c3df
setProductEditionTokenId - tx:  0xf7cd9fa54945f5b9a5ab92c7a18885f30ddd63aea583e2d6f6784c6e7c02ed6c
setProductEditionTokenId - tx:  0x68cd93f0d4c7aeb614c66681b0cbc015bcdad2ea40edb9576f2ea31be3046aef
setProductEditionTokenId - tx:  0xdadab12a7d369e3baf5b2920693dd344ebad3fd70b2c8d37a9d0c4a32678e830
tokenId:  3

```

# Data migration of the current Marketplace contract to the new one

1. Test script on Matic testnet

  - Implemented in `scripts/migrate_marketplace.js`
    - Input params:
        - `MarketplaceContractAddress_current`
        - `DbiliaTokenContractAddress_current`
        - `DbiliaTokenContractAddress_new`

  - Test scenario:
    - Reference the current `Marketplace` contract
    - Deploy new `Marketplace` contract
    - Replicate data of the current `Marketplace` contract to the new one

  - Cmd: `yarn migrate-marketplace-matictestnet`

2. Log output

```
contractsTesting$ yarn migrate-marketplace-matictestnet
yarn run v1.22.5
warning package.json: No license field
$ npx hardhat run --network matictestnet scripts/migrate_marketplace.js
Current DbiliaToken contract - address:  0x92ffd3f6C549AC6f9ae5d995F92988a897C8BEa3 , totalSupply:  46
New Marketplace contract - address:  0xF2a33979D7A6D170e3AF7Bcc62D00FEdBDDC3c48
tokenId:  1
tokenPriceFiat:  15
setTokenPriceFiat - tx:  0x4f7f2e505ecd30786eaffbd6901f56e99c97548018ddb851c7a0886f3d6cfe27
tokenOnAuction:  true
setTokenOnAuction - tx:  0x9634ca82f9fd58f648527e2ae998b53db9992e49a663c9dcd997f4312fb4f6fb
tokenId:  2
tokenPriceFiat:  13
setTokenPriceFiat - tx:  0x654457148a9876133e3ff3659b11afd6dd57ce01f5838489e53684cb526c9606
tokenOnAuction:  true
```