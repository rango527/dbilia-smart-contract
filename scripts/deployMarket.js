async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile 
    // manually to make sure everything is compiled
    // await hre.run('compile');
  
    // We get the contract to deploy
    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const MarketplaceContract = await Marketplace.deploy("0xf7AEf0E7e883770045eD0636FB8b0D8949760Ba5");
  
    await MarketplaceContract.deployed();
  
    console.log("MarketplaceContract deployed to:", MarketplaceContract.address);
  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });