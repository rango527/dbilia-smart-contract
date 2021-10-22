const fs = require("fs");
// Set to true for Momenta app with base currency of EUR. Any functions of "WithFiat" will be meant for "WithEUR"
// Set to false for Dbilia app with base currency of USD
const useEUR = false;

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.

  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  if (!useEUR) {
    throw new Error("Missing specification of useEUR");
  }

  const signers = await hre.ethers.getSigners();
  const signerCEO = signers[0];
  const signerDbiliaTrust = signers[1];

  const { chainId } = await hre.ethers.provider.getNetwork();

  //// For WethReceiver ////
  let wethAddress;
  let beneficiaryAddress;

  // Matic mainnet
  if (chainId === 137) {
    beneficiaryAddress = signerDbiliaTrust.address;
    wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  } else {
    beneficiaryAddress = "0x174D5F160C194101C74aF6eeBaed2bc61A71F111";
    wethAddress = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
  }


  // We get the contract to deploy
  const Dbilia = await hre.ethers.getContractFactory("DbiliaToken");
  const DbiliaToken = await Dbilia.deploy("Dbilia", "NFT", 25, wethAddress, beneficiaryAddress);

  await DbiliaToken.deployed();
  fs.writeFileSync("deployed_dbiliaToken_address", DbiliaToken.address);
  console.log("DbiliaToken deployed to:", DbiliaToken.address);
  console.log('--------------------------------------');

  ///// Batch mint /////
  const royaltyReceiverId = "6097cf186eaef77320e81fcc";
  const royaltyPercentage = 5;
  const minterId = "6099967cb589f4488cdb8105";
  const productId = "60ad481e27a4265b10d73b13";
  const editionAmount = 200; // total editions to be batch minted
  const editionMaxAmountPerMint = 70; // consumed nearly 19 millions of gas
  let editionIdStart = 1; // the first editionId to be batch minted
  let editionIdEnd; // determined on the fly
  const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";


  for (let i = 1; i <= (editionAmount / editionMaxAmountPerMint); i++) {
    editionIdEnd = editionIdStart + editionMaxAmountPerMint - 1;
    tx = await DbiliaToken.batchMintWithFiatw2user(
      royaltyReceiverId,
      royaltyPercentage,
      minterId,
      productId,
      editionIdStart,
      editionIdEnd,
      tokenURI
    );

    // Update editionIdStart for next cycle
    editionIdStart = editionIdEnd + 1;

    console.log(`${editionMaxAmountPerMint} tokens minted`);
    console.log('tx hash:', tx.hash);
    console.log('tx gasPrice:', tx.gasPrice.toString());
    console.log('tx gasLimit:', tx.gasLimit.toString());
    console.log('--------------------------------------');
  }

  const remainder = editionAmount % editionMaxAmountPerMint
  if (remainder > 0) {
    editionIdEnd = editionIdStart + remainder - 1;
    tx = await DbiliaToken.batchMintWithFiatw2user(
      royaltyReceiverId,
      royaltyPercentage,
      minterId,
      productId,
      editionIdStart,
      editionIdEnd,
      tokenURI
    );

    console.log(`${remainder} tokens minted`);
    console.log('tx hash:', tx.hash);
    console.log('tx gasPrice:', tx.gasPrice.toString());
    console.log('tx gasLimit:', tx.gasLimit.toString());
    console.log('--------------------------------------');
  }

  const sleepInSeconds = 10;
  console.log(`please wait for ${sleepInSeconds} seconds`);
  console.log('--------------------------------------');

  // Sleep for n seconds for network syncing
  // turns out balance is not accurate after sleep
  // public test node takes awhile until it's fully synced, so we must test it with the paid one
  await new Promise(r => setTimeout(r, sleepInSeconds * 1000));

  const balance = await DbiliaToken.balanceOf(signers[0].address);
  console.log(`${balance.toString()} owner balance`);
  console.log('--------------------------------------');

  const total = await DbiliaToken.totalSupply();
  console.log(`${total.toString()} total minted`);
  console.log('--------------------------------------');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
