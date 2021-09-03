async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const { chainId } = await hre.ethers.provider.getNetwork();

  let dbiliaTokenAddress;
  let beneficiaryAddress;
  let wethAddress;

  // Matic mainnet
  if (chainId === 137) {
    dbiliaTokenAddress = "";
    beneficiaryAddress = "";
    wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  } else {
    dbiliaTokenAddress = "0xaAeEeaDCCF81db8F50cDE7443F9025F105957380";
    beneficiaryAddress = "0x174D5F160C194101C74aF6eeBaed2bc61A71F111";
    wethAddress = "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa";
  }

  const WethReceiver = await hre.ethers.getContractFactory("WethReceiver");
  const WethReceiverContract = await WethReceiver.deploy(
    dbiliaTokenAddress,
    wethAddress,
    beneficiaryAddress
  );

  await WethReceiverContract.deployed();
  console.log(
    "WethReceiverContract deployed to:",
    WethReceiverContract.address
  );
  console.log(
    `dbiliaTokenAddress:${dbiliaTokenAddress}, wethAddress:${wethAddress}, beneficiaryAddress:${beneficiaryAddress}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
