const fs = require("fs");

async function main() {
  const password = process.env.KEYSTORE_PASSWORD_DBILIA || "dbiliaTrust";
  const privateKey =
    process.env.DBILIA_WALLET_PRIVATE_KEY_DBILIA ||
    "e91e185ae353dcbd575173d205a0d9162fc04eb1378e2d7d9e2ea6abf46b6487";
  let wallet = new hre.ethers.Wallet(privateKey);
  let encrypted = await wallet.encrypt(password);
  let toLowercase = await _convertKeysToLowerCase(JSON.parse(encrypted)); 
  fs.writeFileSync("keystore_dbiliaTrust.json", JSON.stringify(toLowercase));
}

 const _convertKeysToLowerCase = async (obj) => {
  Object.keys(obj).map(key => {
    if (key.toLowerCase() != key) {
      obj[key.toLowerCase()] = obj[key];
      delete obj[key];
    }
  });
  return obj;
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
