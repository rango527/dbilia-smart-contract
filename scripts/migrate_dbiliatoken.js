const fs = require("fs");

///// Input params /////
const DbiliaTokenContractAddress_current =
  "0x92ffd3f6C549AC6f9ae5d995F92988a897C8BEa3";

// The info of _productId and _edition is stored in DB and thus can be retrieval with some API
const productIdEditionList = [
  {
    productId: "123",
    edition: 1,
  },
  {
    productId: "123",
    edition: 2,
  },
  {
    productId: "456",
    edition: 1,
  },
];
////////////////////////

async function main() {
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

  const DbiliaToken = await hre.ethers.getContractFactory("DbiliaToken");

  // Reference the current DbiliaToken contract
  const DbiliaTokenContract_current = await DbiliaToken.attach(
    DbiliaTokenContractAddress_current
  );

  // This is the newly-deployed DbiliaToken contract
  const DbiliaTokenContract_new = await DbiliaToken.deploy(
    "Dbilia New",
    "NFT",
    25,
    wethAddress,
    beneficiaryAddress
  );

  // Get the totalSuppy of the current DbiliaToken contract
  const totalSupply_current =
    await DbiliaTokenContract_current.totalSupply().then(
      (res) => +res.toString()
    );

  console.log(
    "Current DbiliaToken contract - address: ",
    DbiliaTokenContract_current.address,
    ", totalSupply: ",
    totalSupply_current
  );

  console.log(
    "New DbiliaToken contract - address: ",
    DbiliaTokenContract_new.address
  );

  // Migrate data from tokenId of 1 upto the totalSupply
  let tx;
  for (let i = 1; i <= totalSupply_current; i++) {
    try {
      console.log("tokenId: ", i);

      // mint token to the new DbiliaToken contract
      const tokenOwner = await DbiliaTokenContract_current.ownerOf(i);
      const tokenURI = await DbiliaTokenContract_current.tokenURI(i);
      tx = await DbiliaTokenContract_new.mintForDataMigration(
        tokenOwner,
        tokenURI,
        i
      );
      console.log("mintForDataMigration - tx: ", tx.hash);

      // replicate royalty receiver of current DbiliaToken contract to the new one
      const [percentage, receiverId] =
        await DbiliaTokenContract_current.royaltyReceivers(i);
      console.log(
        "percentage: ",
        +percentage.toString(),
        ", receiverId: ",
        receiverId
      );
      tx = await DbiliaTokenContract_new.setRoyaltyReceiver(
        i,
        receiverId,
        percentage
      );
      console.log("setRoyaltyReceiver - tx: ", tx.hash);

      // replicate token owner of current DbiliaToken contract to the new one
      const [isW3user, w3owner, w2owner] =
        await DbiliaTokenContract_current.tokenOwners(i);
      console.log(
        "isW3user: ",
        isW3user,
        ", w3owner: ",
        w3owner,
        ", w2owner: ",
        w2owner
      );

      tx = await DbiliaTokenContract_new.setTokenOwner(
        i,
        isW3user,
        w3owner,
        w2owner
      );
      console.log("setTokenOwner - tx: ", tx.hash);

      // replicate tokenId for a given _productId and _edition of  of current DbiliaToken contract to the new one
      for (const productIdEdition of productIdEditionList) {
        const { productId, edition } = productIdEdition;
        const tokenId = await DbiliaTokenContract_current.productEditions(
          productId,
          edition
        );
        tx = await DbiliaTokenContract_new.setProductEditionTokenId(
          tokenId,
          productId,
          edition
        );
        console.log("setProductEditionTokenId - tx: ", tx.hash);
      }
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
