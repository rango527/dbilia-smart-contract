// Set to true for Momenta app with base currency of EUR. Any functions of "WithUSD" will be meant for "WithEUR"
// Set to false for Dbilia app with base currency of USD
const useEUR = null;

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
  const signerDbiliaFee = signers[2];

  // We get the contract to deploy
  const Dbilia = await hre.ethers.getContractFactory("DbiliaToken");
  const DbiliaToken = await Dbilia.deploy("Dbilia", "NFT", 25);

  const { chainId } = await hre.ethers.provider.getNetwork();

  //// For WethReceiver ////
  let wethAddress;
  let beneficiaryAddress;
  let dbiliaFeeAddress;

  // Matic mainnet
  if (chainId === 137) {
    beneficiaryAddress = signerDbiliaTrust.address;
    dbiliaFeeAddress = signerDbiliaFee.address;
    wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  } else {
    beneficiaryAddress = "0x174D5F160C194101C74aF6eeBaed2bc61A71F111";
    dbiliaFeeAddress = "0x1E215447224c4C984D10B4D1617f448226949F51";
    wethAddress = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
  }

  await DbiliaToken.deployed();
  console.log("DbiliaToken deployed to:", DbiliaToken.address);

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const MarketplaceContract = await Marketplace.deploy(
    DbiliaToken.address,
    wethAddress,
    useEUR
  );

  await MarketplaceContract.deployed();
  console.log("MarketplaceContract deployed to:", MarketplaceContract.address);

  let tx = await DbiliaToken.changeDbiliaTrust(beneficiaryAddress);
  console.log("DbiliaToken.changeDbiliaTrust - tx:", tx.hash);

  tx = await DbiliaToken.changeDbiliaFee(dbiliaFeeAddress);
  console.log("DbiliaToken.changeDbiliaFee - tx:", tx.hash);

  tx = await DbiliaToken.changeMarketplace(MarketplaceContract.address);
  console.log("DbiliaToken.changeMarketplace - tx:", tx.hash);

  tx = await DbiliaToken.connect(signerDbiliaTrust).setApprovalForAll(
    MarketplaceContract.address,
    true
  );
  console.log("DbiliaToken.setApprovalForAll - tx:", tx.hash);

  const WethReceiver = await hre.ethers.getContractFactory("WethReceiver");
  const WethReceiverContract = await WethReceiver.deploy(
    DbiliaToken.address,
    wethAddress,
    beneficiaryAddress
  );

  await WethReceiverContract.deployed();
  console.log(
    "WethReceiverContract deployed to:",
    WethReceiverContract.address
  );
  console.log(
    `wethAddress:${wethAddress}, beneficiaryAddress:${beneficiaryAddress}`
  );

  // WETH approves WethReceiver contract
  const MAX_UINT =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";

  const WethToken = await hre.ethers.getContractFactory("WethTest");
  const WethTokenContract = await WethToken.attach(wethAddress);
  tx = await WethTokenContract.connect(signerDbiliaTrust).approve(
    WethReceiverContract.address,
    MAX_UINT
  );
  console.log("WethToken.approve - tx:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
