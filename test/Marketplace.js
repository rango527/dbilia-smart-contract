const { expect } = require("chai");

describe("MarketPlace contract", function () {
  var name = "Dbilia Token";
  var symbol = "DBT";
  var feePercent = 25;
  let DbiliaToken;
  let Marketplace;
  let ceo;
  let dbilia;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    DbiliaToken = await ethers.getContractFactory("DbiliaToken");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [ceo, dbilia, user1, user2, ...addrs] = await ethers.getSigners();
    DbiliaToken = await DbiliaToken.deploy(name, symbol, feePercent);
    Marketplace = await Marketplace.deploy(DbiliaToken.address);
  });

  beforeEach(async function () {
    await DbiliaToken.changeDbiliaTrust(dbilia.address);
    await DbiliaToken.changeMarketplace(Marketplace.address);
  });

  describe("setForSaleWithUSD", function () {
    it("Should set the right CEO", async function () {
      expect(await DbiliaToken.owner()).to.equal(ceo.address);
    });
    it("Should set the name of token", async function () {
      expect(await DbiliaToken.name()).to.equal(name);
    });
    it("Should set the symbol of token", async function () {
      expect(await DbiliaToken.symbol()).to.equal(symbol);
    });
    it("Should set the fee percent", async function () {
      expect(await DbiliaToken.feePercent()).to.equal(feePercent);
    });
  });
});
