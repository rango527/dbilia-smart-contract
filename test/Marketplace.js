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

  describe("Deployment", function () {
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

  describe("Dbilia sets price with USD for sale", function () {
    describe("Success", function () {
      const priceUSD = 500;
      beforeEach(async function () {
        await DbiliaToken.connect(dbilia).setApprovalForAll(Marketplace.address, true);
        await Marketplace.connect(dbilia).setForSaleWithUSD(1, priceUSD);
      });

      it("Should track tokens price", async function () {
        const tokenPrice = await Marketplace.tokenPriceUSD(1);
        expect(tokenPrice).to.equal(priceUSD);
      });
    });

    describe("Fail", function () {
      const priceUSD = 500;
      it("Should fail if the token price is already set", async function () {
        await DbiliaToken.connect(dbilia).setApprovalForAll(Marketplace.address, true);
        await Marketplace.connect(dbilia).setForSaleWithUSD(1, priceUSD);
        await expect(
          Marketplace.connect(dbilia).setForSaleWithUSD(1, 100)
        ).to.be.revertedWith("token has already been set for sale"); 
      });

      it("Should fail if the dbilia did not approve MarketPlace", async function () {
        await expect(
          Marketplace.connect(dbilia).setForSaleWithUSD(1, priceUSD)
        ).to.be.revertedWith("Dbilia did not approve Marketplace contract");
      });

      it("Should fail when other accounts trying to trigger", async function () {
        await expect(
          Marketplace.connect(user1).setForSaleWithUSD(1, priceUSD)
        ).to.be.revertedWith("caller is not one of dbilia accounts"); 
      });
    });
  });

  describe("Token owner sets price with USD for sale", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const priceUSD = 500;

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(user1).mintWithETH(
        royaltyReceiverId,
        royaltyPercentage,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithETH"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    describe("Success", function () {
      it("Should track tokens price", async function () {
        await DbiliaToken.connect(user1).setApprovalForAll(Marketplace.address, true);
        await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD);
        const tokenPrice = await Marketplace.tokenPriceUSD(1);
        expect(tokenPrice).to.equal(priceUSD);
      });
    });

    describe("Fail", function () {
      it("Should fail if the caller is not the token owner", async function () {
        await expect(
          Marketplace.connect(user2).setForSaleWithETH(1, priceUSD)
        ).to.be.revertedWith("caller is not a token owner"); 
      });
    });
  });

  describe("w2user is purchasing With USD if seller is a web2 user", function () {
    const priceUSD = 500;
    const buyerId = "6097cf186eaef77320e81fdd";

    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const minterId = "6099967cb589f4488cdb8105";
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(dbilia).mintWithUSDw2user(
        royaltyReceiverId,
        royaltyPercentage,
        minterId,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithUSDw2user"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, minterId, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(dbilia).setApprovalForAll(Marketplace.address, true);
      await Marketplace.connect(dbilia).setForSaleWithUSD(1, priceUSD);
      
    });

    describe("Success", function () {
      it("Should check token owner", async function () {
        let tokenowner1 = await DbiliaToken.tokenOwners(1);
        await Marketplace.connect(dbilia).purchaseWithUSDw2user(1, buyerId);
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal("0x0000000000000000000000000000000000000000");
        expect(tokenowner.isW3user).to.equal(false);
        expect(tokenowner.w2owner).to.equal(buyerId);
      });
    });

    describe("Fail", function () {
      it("Should fail if the seller is not selling the token", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw2user(2, buyerId)
        ).to.be.revertedWith("seller is not selling this token"); 
      });

      it("Should fail if byerId is missing", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw2user(1, "")
        ).to.be.revertedWith("buyerId Id is empty"); 
      });
    });
  });

  describe("w2user is purchasing With USD if seller is a web3 user", function () {
    const priceUSD = 500;
    const buyerId = "6097cf186eaef77320e81fdd";

    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(user1).mintWithETH(
        royaltyReceiverId,
        royaltyPercentage,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithETH"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(user1).setApprovalForAll(Marketplace.address, true);
      await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD);
    });

    describe("Success", function () {
      beforeEach(async function () {
        await Marketplace.connect(dbilia).purchaseWithUSDw2user(1, buyerId);
      });

      it("Should check balance", async function () {
        const balance = await DbiliaToken.balanceOf(dbilia.address);
        expect(balance.toString()).to.equal("1");
      });
      it("Should check token owner", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal("0x0000000000000000000000000000000000000000");
        expect(tokenowner.isW3user).to.equal(false);
        expect(tokenowner.w2owner).to.equal(buyerId);
      });
    });

    describe("Fail", function () {
      it("Should fail if the seller is not selling the token", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw2user(2, buyerId)
        ).to.be.revertedWith("seller is not selling this token"); 
      });

      it("Should fail if byerId is missing", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw2user(1, "")
        ).to.be.revertedWith("buyerId Id is empty"); 
      });
    });
  });

  describe("w3user is purchasing With USD if seller is a web2 user", function () {
    const priceUSD = 500;

    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const minterId = "6099967cb589f4488cdb8105";
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(dbilia).mintWithUSDw2user(
        royaltyReceiverId,
        royaltyPercentage,
        minterId,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithUSDw2user"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, minterId, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(dbilia).setApprovalForAll(Marketplace.address, true);
      await Marketplace.connect(dbilia).setForSaleWithUSD(1, priceUSD);
      
    });

    describe("Success", function () {
      beforeEach(async function () {
        await Marketplace.connect(dbilia).purchaseWithUSDw3user(1, user2.address);
      });

      it("Should check token owner", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal(user2.address);
        expect(tokenowner.isW3user).to.equal(true);
        expect(tokenowner.w2owner).to.equal('');
      });

      it("Should check balance", async function () {
        const balance = await DbiliaToken.balanceOf(user2.address);
        expect(balance.toString()).to.equal("1");
      });

      it("Should check token price after selling", async function () {
        const price = await Marketplace.tokenPriceUSD(1);
        expect(price).to.equal(0);
      });
    });

    describe("Fail", function () {
      it("Should fail if buyer address is zero", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw3user(1, "0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("buyer address is empty");
      });

      it("Should fail if the seller is not selling the token", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw3user(2, user2.address)
        ).to.be.revertedWith("seller is not selling this token"); 
      });

      it("Should fail if other accounts trying to trigger", async function () {
        await expect(
          Marketplace.connect(user1).purchaseWithUSDw3user(1, user2.address)
        ).to.be.revertedWith("caller is not one of dbilia accounts");
      });
    });
  });

  describe("w3user is purchasing With USD if seller is a web3 user", function () {
    const priceUSD = 500;

    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(user1).mintWithETH(
        royaltyReceiverId,
        royaltyPercentage,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithETH"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(user1).setApprovalForAll(Marketplace.address, true);
      await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD);
    });

    describe("Success", function () {
      beforeEach(async function () {
        await Marketplace.connect(dbilia).purchaseWithUSDw3user(1, user2.address);
      });

      it("Should check balance", async function () {
        const balance = await DbiliaToken.balanceOf(user2.address);
        expect(balance.toString()).to.equal("1");
      });
      it("Should check token owner", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal(user2.address);
        expect(tokenowner.isW3user).to.equal(true);
        expect(tokenowner.w2owner).to.equal('');
      });
    });

    describe("Fail", function () {
      it("Should fail if buyer address is zero", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw3user(1, "0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("buyer address is empty");
      });

      it("Should fail if the seller is not selling the token", async function () {
        await expect(
          Marketplace.connect(dbilia).purchaseWithUSDw3user(2, user2.address)
        ).to.be.revertedWith("seller is not selling this token"); 
      });

      it("Should fail if other accounts trying to trigger", async function () {
        await expect(
          Marketplace.connect(user1).purchaseWithUSDw3user(1, user2.address)
        ).to.be.revertedWith("caller is not one of dbilia accounts");
      });
    });
  });
});
