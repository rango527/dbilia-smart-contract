async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const signers = await hre.ethers.getSigners()
  const signerCEO = signers[0];
  const signerDbiliaTrust = signers[1];

  const { chainId } = await hre.ethers.provider.getNetwork();

  let dbiliaTokenAddress;
  let beneficiaryAddress;
  let wethAddress;

  // Matic mainnet
  if (chainId === 137) {
    dbiliaTokenAddress = "";
    beneficiaryAddress = signerDbiliaTrust.address;
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

  // Enable this to reference the existing contract at its deployed address
  // const WethReceiverContract = await WethReceiver.attach('0x4c777168Cc07bC079df9DA6D2d743653A3cd3B63')

  // WETH approves WethReceiver contract
  const MAX_UINT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

  const WethToken = await hre.ethers.getContractFactory("WethTest");
  const WethTokenContract = await WethToken.attach(wethAddress);
  const tx = await WethTokenContract.connect(signerDbiliaTrust).approve(WethReceiverContract.address, MAX_UINT);
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
