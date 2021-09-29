const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("MarketPlace contract use EUR", function () {
  var name = "Dbilia Token";
  var symbol = "DBT";
  var feePercent = 25; // 2.5%
  let DbiliaToken;
  let Marketplace;
  let ceo;
  let dbilia;
  let user1;
  let user2;
  let addrs;
  let WethTest;
  const wethInitialSupply = BigNumber.from(1000000000).mul(
    BigNumber.from((1e18).toString())
  );
  const realPasscode = "protected";
  const passcode = ethers.utils.hexZeroPad(ethers.utils.formatBytes32String(realPasscode), 32)

  // Set to true for Momenta app with base currency of EUR. Any functions of "WithUSD" will be meant for "WithEUR"
  // Set to false for Dbilia app with base currency of USD
  const useEUR = true;

  beforeEach(async function () {
    DbiliaToken = await ethers.getContractFactory("DbiliaToken");
    WethTest = await ethers.getContractFactory("WethTest");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [ceo, dbilia, user1, user2, ...addrs] = await ethers.getSigners();
    DbiliaToken = await DbiliaToken.deploy(name, symbol, feePercent);
    WethTest = await WethTest.deploy(wethInitialSupply);
    Marketplace = await Marketplace.deploy(DbiliaToken.address, WethTest.address, useEUR);
  });

  beforeEach(async function () {
    await DbiliaToken.changeDbiliaTrust(dbilia.address);
    await DbiliaToken.changeMarketplace(Marketplace.address);
    await DbiliaToken.changeDbiliaFee(dbilia.address);
  });

  describe("w3user is purchasing With ETH if seller is a web2 user", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 10; // 10%
    const minterId = "6099967cb589f4488cdb8105";
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const priceUSD = 2000;
    let currentPriceOfETHtoUSD;
    const auction = false;

    beforeEach(async function () {
      let block = await ethers.provider.getBlock("latest");
      expect(
        await DbiliaToken.connect(dbilia).mintWithUSDw2user(
          royaltyReceiverId,
          royaltyPercentage,
          minterId,
          productId,
          edition,
          tokenURI
        )
      )
        .to.emit(DbiliaToken, "MintWithUSDw2user")
        .withArgs(
          1,
          royaltyReceiverId,
          royaltyPercentage,
          minterId,
          productId,
          edition,
          block.timestamp + 1
        );
    });

    beforeEach(async function () {
      currentPriceOfETHtoUSD = await Marketplace.getCurrentPriceOfETHtoUSD();
      await DbiliaToken.connect(dbilia).setApprovalForAll(
        Marketplace.address,
        true
      );
      await Marketplace.connect(dbilia).setForSaleWithETH(1, priceUSD, auction, ethers.utils.keccak256(passcode + dbilia.address.substring(2)));
    });

    describe("Success", function () {
      let firstFee;
      let fee;
      let royalty;
      let sellerReceiveAmount;
      let balance_dbilia;

      beforeEach(async function () {
        balance_dbilia = await WethTest.balanceOf(dbilia.address);

        const buyerTotalToWei = await Marketplace.getTokenPriceInWethAmountForPurchase(1);

        firstFee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent)).div(feePercent + 1000);
        fee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent).mul(2)).div(feePercent + 1000);
        royalty = BigNumber.from(buyerTotalToWei.toString()).sub(firstFee).mul(BigNumber.from(royaltyPercentage)).div(100);
        sellerReceiveAmount = BigNumber.from(buyerTotalToWei.toString()).sub(royalty).sub(fee);

        await WethTest.connect(ceo).transfer(user2.address, buyerTotalToWei.toString());
        await WethTest.connect(user2).approve(Marketplace.address, buyerTotalToWei.toString());
        let block = await ethers.provider.getBlock('latest');
        expect(await Marketplace.connect(user2).purchaseWithETHw3user(1, buyerTotalToWei.toString(), ethers.utils.keccak256(passcode + user2.address.substring(2)))).to.emit(
          Marketplace,
          "PurchaseWithETH"
        ).withArgs(1, user2.address, false, "0x0000000000000000000000000000000000000000", minterId, fee, royalty, sellerReceiveAmount, block.timestamp+1);
      });
      it("Should send fee, royalty, payment to dbilia", async function () {
        const balance_dbilia_afterSelling = await WethTest.balanceOf(dbilia.address);
        expect(
          BigNumber.from(balance_dbilia)
            .add(fee)
            .add(royalty)
            .add(sellerReceiveAmount)
        ).to.equal(BigNumber.from(balance_dbilia_afterSelling));
      });
      it("Should check balance", async function () {
        const balance = await DbiliaToken.balanceOf(user2.address);
        expect(balance.toString()).to.equal("1");
      });
      it("Should check token owner", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal(user2.address);
        expect(tokenowner.isW3user).to.equal(true);
        expect(tokenowner.w2owner).to.equal("");
      });
    });

    describe("Fail", function () {
      it("Should fail if the seller is not selling the token", async function () {
        const payAmount = BigNumber.from((10 ** 18).toString()); // 1 ETH
        await WethTest.connect(ceo).transfer(user2.address, payAmount);
        await WethTest.connect(user2).approve(Marketplace.address, payAmount);
        await expect(
          Marketplace.connect(user2).purchaseWithETHw3user(2, payAmount, ethers.utils.keccak256(passcode + user2.address.substring(2)))
        ).to.be.revertedWith("seller is not selling this token");
      });

      it("Should fail if the pay amount is less than the token price", async function () {
        const lessPayAmount = BigNumber.from((10 ** 17).toString());
        await WethTest.connect(ceo).transfer(user2.address, lessPayAmount);
        await WethTest.connect(user2).approve(Marketplace.address, lessPayAmount);
        await expect(
          Marketplace.connect(user2).purchaseWithETHw3user(1, lessPayAmount, ethers.utils.keccak256(passcode + user2.address.substring(2)))
        ).to.be.revertedWith("not enough of ETH being sent");
      });
    });
  });

  describe("w3user is purchasing With ETH if seller is a web3 user", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 10; // 10%
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const priceUSD = 2000;
    const auction = false;

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(user1).mintWithETH(
        royaltyReceiverId,
        royaltyPercentage,
        productId,
        edition,
        tokenURI,
        ethers.utils.keccak256(passcode + user1.address.substring(2))
      )).to.emit(
        DbiliaToken,
        "MintWithETH"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(user1).setApprovalForAll(Marketplace.address, true);
      await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD, auction, ethers.utils.keccak256(passcode + user1.address.substring(2)));
    });

    describe("Success", function () {
      let firstFee;
      let fee;
      let royalty;
      let sellerReceiveAmount;
      let balance_dbilia;
      let balance_user1;

      beforeEach(async function () {
        balance_dbilia = await WethTest.balanceOf(dbilia.address);
        balance_user1 = await WethTest.balanceOf(user1.address);

        const buyerTotalToWei = await Marketplace.getTokenPriceInWethAmountForPurchase(1);

        firstFee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent)).div(feePercent + 1000);
        fee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent).mul(2)).div(feePercent + 1000);
        royalty = BigNumber.from(buyerTotalToWei.toString()).sub(firstFee).mul(BigNumber.from(royaltyPercentage)).div(100);
        sellerReceiveAmount = BigNumber.from(buyerTotalToWei.toString()).sub(royalty).sub(fee);

        await WethTest.connect(ceo).transfer(user2.address, buyerTotalToWei.toString());
        await WethTest.connect(user2).approve(Marketplace.address, buyerTotalToWei.toString());
        let block = await ethers.provider.getBlock('latest');
        expect(await Marketplace.connect(user2).purchaseWithETHw3user(1, buyerTotalToWei.toString(), ethers.utils.keccak256(passcode + user2.address.substring(2)))).to.emit(
          Marketplace,
          "PurchaseWithETH"
        ).withArgs(1, user2.address, true, user1.address, "", fee, royalty, sellerReceiveAmount, block.timestamp+1);

        const balance_user1_afterSelling = await WethTest.balanceOf(user1.address);
        expect(BigNumber.from(balance_user1).add(sellerReceiveAmount)).to.equal(BigNumber.from(balance_user1_afterSelling));
      });
      it("Should send fee and royalty to dbilia", async function () {
        const balance_dbilia_afterSelling = await WethTest.balanceOf(dbilia.address);
        expect(BigNumber.from(balance_dbilia).add(fee).add(royalty)).to.equal(
          BigNumber.from(balance_dbilia_afterSelling)
        );
      });
      it("Should send payment to w3user seller", async function () {
        const balance_user1_afterSelling = await WethTest.balanceOf(user1.address);
        expect(BigNumber.from(balance_user1).add(sellerReceiveAmount)).to.equal(
          BigNumber.from(balance_user1_afterSelling)
        );
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
      it("Should fail if the seller is not selling the token", async function () {
        const payAmount = BigNumber.from((10**18).toString()); // 1 ETH
        await WethTest.connect(ceo).transfer(user2.address, payAmount);
        await WethTest.connect(user2).approve(Marketplace.address, payAmount);
        await expect(
          Marketplace.connect(user2).purchaseWithETHw3user(2, payAmount, ethers.utils.keccak256(passcode + user2.address.substring(2)))
        ).to.be.revertedWith("seller is not selling this token");
      });

      it("Should fail if the pay amount is less than the token price", async function () {
        const lessPayAmount = BigNumber.from((10**17).toString());
        await WethTest.connect(ceo).transfer(user2.address, lessPayAmount);
        await WethTest.connect(user2).approve(Marketplace.address, lessPayAmount);
        await expect(
          Marketplace.connect(user2).purchaseWithETHw3user(1, lessPayAmount, ethers.utils.keccak256(passcode + user2.address.substring(2)))
        ).to.be.revertedWith("not enough of ETH being sent");
      });
    });
  });

  describe("w3user placeBid with ETH", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 10; // 10%
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const priceUSD = 1000;
    const auction = true;

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(user1).mintWithETH(
        royaltyReceiverId,
        royaltyPercentage,
        productId,
        edition,
        tokenURI,
        ethers.utils.keccak256(passcode + user1.address.substring(2))
      )).to.emit(
        DbiliaToken,
        "MintWithETH"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    beforeEach(async function () {
      await DbiliaToken.connect(user1).setApprovalForAll(Marketplace.address, true);
    });

    describe("Success", function () {
      let firstFee;
      let fee;
      let royalty;
      let sellerReceiveAmount;
      let balance_dbilia;

      beforeEach(async function () {
        const buyerTotalToWei = await Marketplace.getBidPriceInWethAmountForAuction(priceUSD);
        await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD, auction, ethers.utils.keccak256(passcode + user1.address.substring(2)));
        balance_dbilia = await WethTest.balanceOf(dbilia.address);
        balance_user1 = await WethTest.balanceOf(user1.address);

        firstFee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent)).div(feePercent + 1000);
        fee = BigNumber.from(buyerTotalToWei.toString()).mul(BigNumber.from(feePercent).mul(2)).div(feePercent + 1000);
        royalty = BigNumber.from(buyerTotalToWei.toString()).sub(firstFee).mul(BigNumber.from(royaltyPercentage)).div(100);
        sellerReceiveAmount = BigNumber.from(buyerTotalToWei.toString()).sub(royalty).sub(fee);

        await WethTest.connect(ceo).transfer(user1.address, buyerTotalToWei.toString());
        await WethTest.connect(user1).approve(Marketplace.address, buyerTotalToWei.toString());
        let block = await ethers.provider.getBlock('latest');
        expect(await Marketplace.connect(user1).placeBidWithETHw3user(1, priceUSD, buyerTotalToWei.toString(), ethers.utils.keccak256(passcode + user1.address.substring(2)))).to.emit(
          Marketplace,
          "BiddingWithETH"
        ).withArgs(1, user1.address, fee, royalty, sellerReceiveAmount, block.timestamp+1);
      });
      it("Should placeBid", async function () {
        const buyerTotalToWei = await Marketplace.getBidPriceInWethAmountForAuction(priceUSD);
        const dbilia_afterBid = await WethTest.balanceOf(dbilia.address);
        expect(BigNumber.from(dbilia_afterBid).sub(buyerTotalToWei)).to.equal(BigNumber.from(balance_dbilia));
      });
    });

    describe("Fail", function () {
      it("Should fail if seller is not selling this token", async function () {
        const buyerTotalToWei = await Marketplace.getBidPriceInWethAmountForAuction(priceUSD);
        await WethTest.connect(ceo).transfer(user1.address, buyerTotalToWei.toString());
        await WethTest.connect(user1).approve(Marketplace.address, buyerTotalToWei.toString());
        await expect(
          Marketplace.connect(user1).placeBidWithETHw3user(0, priceUSD, buyerTotalToWei.toString(), ethers.utils.keccak256(passcode + user1.address.substring(2)))
        ).to.be.revertedWith("seller is not selling this token");
      });

      it("Should fail if this token is not on auction", async function () {
        const buyerTotalToWei = await Marketplace.getBidPriceInWethAmountForAuction(priceUSD);
        await Marketplace.connect(user1).setForSaleWithETH(1, priceUSD, false, ethers.utils.keccak256(passcode + user1.address.substring(2)));
        await WethTest.connect(ceo).transfer(user1.address, buyerTotalToWei.toString());
        await WethTest.connect(user1).approve(Marketplace.address, buyerTotalToWei.toString());
        await expect(
          Marketplace.connect(user1).placeBidWithETHw3user(1, priceUSD, buyerTotalToWei.toString(), ethers.utils.keccak256(passcode + user1.address.substring(2)))
        ).to.be.revertedWith("this token is not on auction");
      });
    });
  });
});
