const fs = require("fs");

///// Input params /////
const MarketplaceContractAddress_current = "0x45FEb4D8EFE0Ad1b615EF90eEcb1A744De2594Ff"
const DbiliaTokenContractAddress_current = "0x92ffd3f6C549AC6f9ae5d995F92988a897C8BEa3"
const DbiliaTokenContractAddress_new = "0x0b51926ac2f6F955681ef9f5607C0d8334639A64"
///////////////////////

async function main() {

  const signers = await hre.ethers.getSigners();

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const DbiliaToken = await hre.ethers.getContractFactory("DbiliaToken");
  
  // Reference the current Marketplace contract
  const MarketplaceContract_current = await Marketplace.attach(MarketplaceContractAddress_current);

  // Reference the current DbiliaToken contract
  const DbiliaTokenContract_current = await DbiliaToken.attach(DbiliaTokenContractAddress_current);

  // This is the newly-deployed Marketplace contract
  const MarketplaceContract_new = await Marketplace.deploy(
    DbiliaTokenContractAddress_new,
    "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
    false
  );

  // Get the totalSuppy of the current Marketplace contract
  const totalSupply_current = await DbiliaTokenContract_current.totalSupply()
    .then(res => +res.toString())

  console.log("Current DbiliaToken contract - address: ", 
    DbiliaTokenContract_current.address, 
    ", totalSupply: ", totalSupply_current
  );

  console.log("New Marketplace contract - address: ", MarketplaceContract_new.address);

  // Migrate data from tokenId of 1 upto the totalSupply
  let tx
  for (let i=1; i<=totalSupply_current; i++) {
    try {
      console.log("tokenId: ", i);

      const tokenPriceFiat = await MarketplaceContract_current.tokenPriceFiat(i);
      console.log("tokenPriceFiat: ", +tokenPriceFiat.toString());
      tx = await MarketplaceContract_new.setTokenPriceFiat(i, tokenPriceFiat);
      console.log("setTokenPriceFiat - tx: ", tx.hash);

      const tokenOnAuction = await MarketplaceContract_current.tokenOnAuction(i);
      console.log("tokenOnAuction: ", tokenOnAuction);
      tx = await MarketplaceContract_new.setTokenOnAuction(i, tokenOnAuction);
      console.log("setTokenOnAuction - tx: ", tx.hash);
    } catch (err) {
      console.log(err);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
