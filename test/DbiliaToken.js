const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DbiliaToken contract", function () {
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

  describe("CEO adds/changes accounts in AccessControl", function () {
    describe("Success", function () {
      it("Should set the right DbiliaTrust account", async function () {
        expect(await DbiliaToken.dbiliaTrust()).to.equal(dbilia.address);
      });
      it("Should set the right Marketplace account", async function () {
        expect(await DbiliaToken.marketplace()).to.equal(Marketplace.address);
      });
    });

    describe("Fail", function () {
      it("Should fail if other accounts are trying to change ceo account", async function () {
        await expect(
          DbiliaToken.connect(user1).changeOwner(user1.address)
        ).to.be.revertedWith("caller is not CEO");
      });
      it("Should fail if other accounts are trying to change dbilia trust account", async function () {
        await expect(
          DbiliaToken.connect(dbilia).changeDbiliaTrust(user1.address)
        ).to.be.revertedWith("caller is not CEO");
      });
      it("Should fail if other accounts are trying to change marketplace account", async function () {
        await expect(
          DbiliaToken.connect(user2).changeDbiliaTrust(user2.address)
        ).to.be.revertedWith("caller is not CEO");
      });
    });
  });

  describe("w2user is minting with USD", function () {
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

    describe("Success", function () {
      it("Should create a new token", async function () {
        const balance = await DbiliaToken.balanceOf(dbilia.address);
        const owner = await DbiliaToken.ownerOf(1);
        expect(balance.toString()).to.equal("1");
        expect(owner).to.equal(dbilia.address);
      });
      it("Should track the creator of card", async function () {
        let creator = await DbiliaToken.royaltyReceivers(1);
        expect(creator.receiverId).to.equal(
          royaltyReceiverId
        );
        expect(creator.percentage).to.equal(
          royaltyPercentage
        );
      });
      it("Should track the owner of token", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal("0x0000000000000000000000000000000000000000");
        expect(tokenowner.isW3user).to.equal(false);
        expect(tokenowner.w2owner).to.equal(minterId);
      });
      it("Should map productId and edition to a new token", async function () {
        expect(await DbiliaToken.productEditions(productId, edition)).to.equal(
          1
        );
      });
      it("Should create a token and Dbilia keeps it", async function () {
        expect(await DbiliaToken.ownerOf(1)).to.equal(dbilia.address);
      });
      it("Should keep a token uri", async function () {
        expect(await DbiliaToken.tokenURI(1)).to.equal(tokenURI);
      });
    });

    describe("Fail", function () {
      it("Should fail if royaltyReceiverId is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            "",
            royaltyPercentage,
            minterId,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("royalty receiver id is empty");
      });
      it("Should fail if minterId is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            "",
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("minter id is empty");
      });
      it("Should fail if productId is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            minterId,
            "",
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product id is empty");
      });
      it("Should fail if token uri is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            minterId,
            productId,
            edition,
            ""
          )
        ).to.be.revertedWith("token uri is empty");
      });
      it("Should fail if product edition has already been created", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            minterId,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product edition has already been created");
      });
      it("Should fail if other accounts tried to trigger", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            minterId,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("caller is not one of Dbilia accounts");
      });
    });
  });

  describe("w3user is minting with USD", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(dbilia).mintWithUSDw3user(
        royaltyReceiverId,
        royaltyPercentage,
        user1.address,
        productId,
        edition,
        tokenURI
      )).to.emit(
        DbiliaToken,
        "MintWithUSDw3user"
      ).withArgs(1, royaltyReceiverId, royaltyPercentage, user1.address, productId, edition, block.timestamp+1);
    });

    describe("Success", function () {
      it("Should create a new token", async function () {
        const balance = await DbiliaToken.balanceOf(user1.address);
        const owner = await DbiliaToken.ownerOf(1);
        expect(balance.toString()).to.equal("1");
        expect(owner).to.equal(user1.address);
      });
      it("Should track the creator of card", async function () {
        let creator = await DbiliaToken.royaltyReceivers(1);
        expect(creator.receiverId).to.equal(
          royaltyReceiverId
        );
        expect(creator.percentage).to.equal(
          royaltyPercentage
        );
      });
      it("Should track the owner of token", async function () {
        let tokenowner = await DbiliaToken.tokenOwners(1);
        expect(tokenowner.w3owner).to.equal(user1.address);
        expect(tokenowner.isW3user).to.equal(true);
        expect(tokenowner.w2owner).to.equal('');
      });
      it("Should map productId and edition to a new token", async function () {
        expect(await DbiliaToken.productEditions(productId, edition)).to.equal(
          1
        );
      });
      it("Should create a token and Dbilia keeps it", async function () {
        expect(await DbiliaToken.ownerOf(1)).to.equal(user1.address);
      });
      it("Should keep a token uri", async function () {
        expect(await DbiliaToken.tokenURI(1)).to.equal(tokenURI);
      });
    });

    describe("Fail", function () {
      it("Should fail if royaltyReceiverId is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw3user(
            "",
            royaltyPercentage,
            user1.address,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("royalty receiver id is empty");
      });
      it("Should fail if minter address is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            "",
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("minter id is empty");
      });
      it("Should fail if productId is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            user1.address,
            "",
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product id is empty");
      });
      it("Should fail if token uri is missing", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            user1.address,
            productId,
            edition,
            ""
          )
        ).to.be.revertedWith("token uri is empty");
      });
      it("Should fail if product edition has already been created", async function () {
        await expect(
          DbiliaToken.connect(dbilia).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            user1.address,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product edition has already been created");
      });
      it("Should fail if other accounts tried to trigger", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithUSDw2user(
            royaltyReceiverId,
            royaltyPercentage,
            user1.address,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("caller is not one of Dbilia accounts");
      });
    });
  });

  describe("w3user is minting with ETH", function () {
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

    describe("Success", function () {
      it("Should create a new token", async function () {
        const balance = await DbiliaToken.balanceOf(user1.address);
        const owner = await DbiliaToken.ownerOf(1);
        expect(balance.toString()).to.equal("1");
        expect(owner).to.equal(user1.address);
      });
      it("Should track the creator of card", async function () {
        let creator = await DbiliaToken.royaltyReceivers(1);
        expect(creator.receiverId).to.equal(
          royaltyReceiverId
        );
        expect(creator.percentage).to.equal(
          royaltyPercentage
        );
      });
      it("Should track the owner of token", async function () {
        expect(await DbiliaToken.ownerOf(1)).to.equal(user1.address);
      });
      it("Should map productId and edition to a new token", async function () {
        expect(await DbiliaToken.productEditions(productId, edition)).to.equal(
          1
        );
      });
      it("Should keep a token uri", async function () {
        expect(await DbiliaToken.tokenURI(1)).to.equal(tokenURI);
      });
    });

    describe("Fail", function () {
      it("Should fail if royaltyReceiverId is missing", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithETH(
            "",
            royaltyPercentage,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("royalty receiver id is empty");
      });
      it("Should fail if productId is missing", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithETH(
            royaltyReceiverId,
            royaltyPercentage,
            "",
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product id is empty");
      });
      it("Should fail if token uri is missing", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithETH(
            royaltyReceiverId,
            royaltyPercentage,
            productId,
            edition,
            ""
          )
        ).to.be.revertedWith("token uri is empty");
      });
      it("Should fail if product edition has already been created", async function () {
        await expect(
          DbiliaToken.connect(user1).mintWithETH(
            royaltyReceiverId,
            royaltyPercentage,
            productId,
            edition,
            tokenURI
          )
        ).to.be.revertedWith("product edition has already been created");
      });
    });
  });

  describe("CEO sets flat fee", function () {
    const newFeePercent = 27;

    beforeEach(async function () {
      await DbiliaToken.setFlatFee(newFeePercent);
    });

    it("Should change the flat fee", async function () {
      expect(await DbiliaToken.feePercent()).to.equal(newFeePercent);
    });
    it("Should fail when other accounts trying to trigger", async function () {
      await expect(
        DbiliaToken.connect(user1).setFlatFee(27)
      ).to.be.revertedWith("caller is not CEO");
    });
  });

  describe("Dbilia changes w2user ownership", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const minterId = "6099967cb589f4488cdb8105";
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";
    const minterId2 = "1042967cb589f4488cdb5346";

    beforeEach(async function () {
      await DbiliaToken.connect(dbilia).mintWithUSDw2user(
        royaltyReceiverId,
        royaltyPercentage,
        minterId,
        productId,
        edition,
        tokenURI
      );
      let block = await ethers.provider.getBlock('latest');
      expect(await DbiliaToken.connect(dbilia).changeTokenOwnership(1, "0x0000000000000000000000000000000000000000", minterId2)).to.emit(
        DbiliaToken,
        "ChangeTokenOwnership"
      ).withArgs(1, minterId2, "0x0000000000000000000000000000000000000000", block.timestamp+1);
    });

    it("Should change ownership", async function () {
      let tokenowner = await DbiliaToken.tokenOwners(1);
      expect(tokenowner.w3owner).to.equal("0x0000000000000000000000000000000000000000");
      expect(tokenowner.isW3user).to.equal(false);
      expect(tokenowner.w2owner).to.equal(minterId2);
    });
    it("Should fail when other accounts trying to trigger", async function () {
      await expect(
        DbiliaToken.connect(user1).changeTokenOwnership(1, "0x0000000000000000000000000000000000000000", minterId2)
      ).to.be.revertedWith("caller is not one of Dbilia accounts");
    });
  });

  describe("Dbilia changes w3user ownership", function () {
    const royaltyReceiverId = "6097cf186eaef77320e81fcc";
    const royaltyPercentage = 5;
    const productId = "60ad481e27a4265b10d73b13";
    const edition = 1;
    const tokenURI = "https://ipfs.io/Qmsdfu89su0s80d0g";

    beforeEach(async function () {
      await DbiliaToken.connect(dbilia).mintWithUSDw3user(
        royaltyReceiverId,
        royaltyPercentage,
        user1.address,
        productId,
        edition,
        tokenURI
      );
      await DbiliaToken.connect(dbilia).changeTokenOwnership(1, user2.address, "");
    });

    it("Should change ownership", async function () {
      let tokenowner = await DbiliaToken.tokenOwners(1);
      expect(tokenowner.w3owner).to.equal(user2.address);
      expect(tokenowner.isW3user).to.equal(true);
      expect(tokenowner.w2owner).to.equal('');
    });
    it("Should fail when other accounts trying to trigger", async function () {
      await expect(
        DbiliaToken.connect(user1).changeTokenOwnership(1, user2.address, "")
      ).to.be.revertedWith("caller is not one of Dbilia accounts");
    });
  });
});