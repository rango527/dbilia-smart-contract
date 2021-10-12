const fs = require("fs");

async function main() {
  const signers = await hre.ethers.getSigners();
  const Dbilia = await hre.ethers.getContractFactory("DbiliaToken");  
  const deployedAddress = fs.readFileSync('deployed_dbiliaToken_address', 'utf8');
  console.log(`deployed address: ${deployedAddress}`);
  console.log('--------------------------------------');
  const DbiliaToken = await Dbilia.attach(deployedAddress);

  const balance = await DbiliaToken.balanceOf(signers[0].address);
  console.log(`${balance.toString()} owner balance`);
  console.log('--------------------------------------');

  const total = await DbiliaToken.totalSupply();
  console.log(`${total.toString()} total minted`);
  console.log('--------------------------------------');

  // const editionAmount = 100;
  // // Random owner check five times between tokenId 1 to editionAmount
  // for (let i = 1; i <= 5; i++) {
  //   const randomNum = Math.floor(Math.random() * editionAmount) + 1
  //   const owner = await DbiliaToken.ownerOf(randomNum);
  //   console.log(`tokenId ${randomNum} owner ${owner}`);
  //   console.log('--------------------------------------');
  // }  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
