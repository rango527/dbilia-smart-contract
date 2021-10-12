# Batch mint multiple editions of the same product

1. Implementation

In contract `DbiliaToken`, function `batchMintWithFiatw2user(...)`

2. Unit-test

  - Implemented in `test/DbiliaToken.js`, test scenario `w2user is batch minting with Fiat`

  - Cmd: `yarn test-token`

3. Test script on Matic testnet

  - Implemented in `scripts/batch_mint.js`
    - Input params:
        const editionAmount = 1000;
        const editionMaxAmountPerMint = 70; // consumed nearly 19 millions of gas

  - Test scenario:
    - Deploy new `DbiliaToken` contract
    - Batch mint 1000 editions with max 70 editions per mint tx

  - Cmd: `yarn batchmint-matictestnet`

  - Optional: to verify the `totalSupply` after the batchMint, run this cmd `yarn checksyncing-matictestnet`

4. Test result

  - It took `62s` to mint totally 1000 editions
  - Totally 14 txs each of which minted 70 editions 
  - An extra 15-th tx minting the remaining 20 editions
  - Each tx:
    - gasPrice: 1 GWei
    - gasLimit: 19742185 (max gas limit on Matic is `20,000,000`)

5. Log output

```
momenta-contract-testing$ yarn batchmint-matictestnet
yarn run v1.22.5
warning package.json: No license field
$ npx hardhat run --network matictestnet scripts/batch_mint.js
DbiliaToken deployed to: 0x10f46b1aBAD4eFD0611b8c4EEa9a06dfC91C5849
70 tokens minted
tx hash: 0xb9f6d0fadb32457489460d26f5cdb9b9794508ad09eaaa82a7ab941fb5638508
tx gasPrice: 1000000000
tx gasLimit: 19742185
--------------------------------------
70 tokens minted
tx hash: 0x346a152113e3b81e00396a19ab3ded80da16305535131e040eefd7dd8742b552
tx gasPrice: 1000000000
tx gasLimit: 19742185
--------------------------------------
70 tokens minted
tx hash: 0x4acbcfb0ef6c78ab0e31b9a47b12b57ad6ae935408368d835fe0ccbf67ea9846
tx gasPrice: 1000000000
tx gasLimit: 19742185
--------------------------------------
70 tokens minted
tx hash: 0x2ec3a6907c63923014c9e53f1391444e2db31b219a89ce688b5538d723ce0701
tx gasPrice: 1000000000
tx gasLimit: 19742185
--------------------------------------
70 tokens minted
tx hash: 0x679e7fe9d0c062cd2000f3f55d83a076d1e5625ef5deb988af128b231b92fab2
tx gasPrice: 1000000000
tx gasLimit: 19742185
--------------------------------------
70 tokens minted
tx hash: 0x61d412d063c624a0e694cb49ba9d6501c1a97baad19935d208311b9c65795a74
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0x9b30839f7a65d1542aeeb7575ead484e912fa3a2fe5daf9fb01e61e4e6b20a66
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0xab1d0f50ded68888366de9d6bbc2f8e2b4850e5b3ad1d4b0edcd512ef3fe35b3
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0xcf9cf598a97c6f453c75a8699bde45064e6999f288012466da95e6fb85d19b49
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0x830dd1db1214215f5e87b446785a9305045867649e07c6623fe229edf928ad35
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0x66dcd93ed524fd1d4da99c773906bb12c24cf6c434127e0df00cd2cf57f281ac
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0xe37f417a67c56986b33619752d574c296464cb34301f97316d375ea201a8d72a
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0x9210608dcf70277b218d2904db06ca9d9776822ee7f3c5dd2cc1803134c822c1
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
70 tokens minted
tx hash: 0x3f447821b8efcbca3d3e6e0d0b5f9107c9fcba1de7c8fca7dc1f13a0ea56cfa3
tx gasPrice: 1000000000
tx gasLimit: 219536
--------------------------------------
20 tokens minted
tx hash: 0xb027d464e5b6099e5120e52039b7f7eaa8be0a4ee139c3203e6952886552b852
tx gasPrice: 1000000000
tx gasLimit: 88286
--------------------------------------
Done in 62.21s.

```