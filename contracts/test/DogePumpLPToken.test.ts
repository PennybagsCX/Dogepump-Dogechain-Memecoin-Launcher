// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpLPToken } from "../typechain-types";
describe("DogePumpLPToken", () => {
  let lpToken: DogePumpLPToken;
  let owner: any;
  let user: any;
  let factory: any;

  beforeEach(async () => {
    [factory, owner, user] = await ethers.getSigners();

    const DogePumpLPToken = await ethers.getContractFactory("DogePumpLPToken");
    lpToken = await DogePumpLPToken.deploy();
    await lpToken.initialize(factory.address);
  });

  describe("Deployment", () => {
    it("Should set correct name", async () => {
      expect(await lpToken.name()).to.equal("DogePump LP Token");
    });

    it("Should set correct symbol", async () => {
      expect(await lpToken.symbol()).to.equal("DPLP");
    });

    it("Should set correct decimals", async () => {
      expect(await lpToken.decimals()).to.equal(18);
    });

    it("Should set correct factory", async () => {
      expect(await lpToken.factory()).to.equal(factory.address);
    });

    it("Should have zero initial supply", async () => {
      expect(await lpToken.totalSupply()).to.equal(0);
    });
  });

  describe("Initialization", () => {
    it("Should revert if already initialized", async () => {
      await expect(
        lpToken.initialize(factory.address)
      ).to.be.revertedWith("ALREADY_INITIALIZED");
    });

    it("Should revert if called by non-factory", async () => {
      const DogePumpLPToken = await ethers.getContractFactory("DogePumpLPToken");
      const lpToken2 = await DogePumpLPToken.deploy();

      await expect(
        lpToken2.initialize(factory.address)
      ).to.be.revertedWith("FORBIDDEN");
    });
  });

  describe("Mint", () => {
    it("Should allow factory to mint tokens", async () => {
      const amount = ethers.parseEther("1000");

      const tx = await lpToken.connect(factory).mint(user.address, amount);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "Transfer");
      expect(event).to.not.be.undefined;
      expect(event.args.from).to.equal(ethers.ZeroAddress);
      expect(event.args.to).to.equal(user.address);
      expect(event.args.value).to.equal(amount);

      expect(await lpToken.balanceOf(user.address)).to.equal(amount);
      expect(await lpToken.totalSupply()).to.equal(amount);
    });

    it("Should revert if called by non-factory", async () => {
      const amount = ethers.parseEther("1000");

      await expect(
        lpToken.mint(user.address, amount)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should revert with zero address", async () => {
      const amount = ethers.parseEther("1000");

      await expect(
        lpToken.connect(factory).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ZeroAddress");
    });

    it("Should revert with zero amount", async () => {
      await expect(
        lpToken.connect(factory).mint(user.address, 0)
      ).to.be.revertedWith("ZeroAmount");
    });

    it("Should emit Transfer event on mint", async () => {
      const amount = ethers.parseEther("1000");

      await expect(
        lpToken.connect(factory).mint(user.address, amount)
      )
        .to.emit(lpToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user.address, amount);
    });
  });

  describe("Burn", () => {
    beforeEach(async () => {
      // Mint some tokens first
      await lpToken.connect(factory).mint(user.address, ethers.parseEther("1000"));
    });

    it("Should allow factory to burn tokens", async () => {
      const amount = ethers.parseEther("500");

      const tx = await lpToken.connect(factory).burn(user.address, amount);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "Transfer");
      expect(event).to.not.be.undefined;
      expect(event.args.from).to.equal(user.address);
      expect(event.args.to).to.equal(ethers.ZeroAddress);
      expect(event.args.value).to.equal(amount);

      expect(await lpToken.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
      expect(await lpToken.totalSupply()).to.equal(ethers.parseEther("500"));
    });

    it("Should revert if called by non-factory", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.burn(user.address, amount)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should revert with insufficient balance", async () => {
      const amount = ethers.parseEther("2000");

      await expect(
        lpToken.connect(factory).burn(user.address, amount)
      ).to.be.revertedWith("InsufficientBalance");
    });

    it("Should revert with zero address", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.connect(factory).burn(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ZeroAddress");
    });

    it("Should revert with zero amount", async () => {
      await expect(
        lpToken.connect(factory).burn(user.address, 0)
      ).to.be.revertedWith("ZeroAmount");
    });

    it("Should emit Transfer event on burn", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.connect(factory).burn(user.address, amount)
      )
        .to.emit(lpToken, "Transfer")
        .withArgs(user.address, ethers.ZeroAddress, amount);
    });
  });

  describe("Transfer", () => {
    beforeEach(async () => {
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async () => {
      const amount = ethers.parseEther("500");

      await lpToken.transfer(user.address, amount);

      expect(await lpToken.balanceOf(owner.address)).to.equal(ethers.parseEther("500"));
      expect(await lpToken.balanceOf(user.address)).to.equal(amount);
    });

    it("Should revert with insufficient balance", async () => {
      const amount = ethers.parseEther("2000");

      await expect(
        lpToken.transfer(user.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should revert with zero address", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("Should emit Transfer event", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.transfer(user.address, amount)
      )
        .to.emit(lpToken, "Transfer")
        .withArgs(owner.address, user.address, amount);
    });
  });

  describe("Approve", () => {
    it("Should approve spending", async () => {
      const amount = ethers.parseEther("500");

      const tx = await lpToken.approve(user.address, amount);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "Approval");
      expect(event).to.not.be.undefined;
      expect(event.args.owner).to.equal(owner.address);
      expect(event.args.spender).to.equal(user.address);
      expect(event.args.value).to.equal(amount);

      expect(await lpToken.allowance(owner.address, user.address)).to.equal(amount);
    });

    it("Should revert with zero address", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.approve(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });

    it("Should emit Approval event", async () => {
      const amount = ethers.parseEther("500");

      await expect(
        lpToken.approve(user.address, amount)
      )
        .to.emit(lpToken, "Approval")
        .withArgs(owner.address, user.address, amount);
    });
  });

  describe("TransferFrom", () => {
    beforeEach(async () => {
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
      await lpToken.approve(user.address, ethers.parseEther("500"));
    });

    it("Should transfer tokens with approval", async () => {
      const amount = ethers.parseEther("500");
      const recipient = ethers.Wallet.createRandom().address;

      await lpToken.connect(user).transferFrom(owner.address, recipient, amount);

      expect(await lpToken.balanceOf(owner.address)).to.equal(ethers.parseEther("500"));
      expect(await lpToken.balanceOf(recipient)).to.equal(amount);
    });

    it("Should revert with insufficient allowance", async () => {
      const amount = ethers.parseEther("1000");
      const recipient = ethers.Wallet.createRandom().address;

      await expect(
        lpToken.connect(user).transferFrom(owner.address, recipient, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should revert with insufficient balance", async () => {
      const amount = ethers.parseEther("2000");
      const recipient = ethers.Wallet.createRandom().address;

      await lpToken.approve(user.address, amount);

      await expect(
        lpToken.connect(user).transferFrom(owner.address, recipient, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should update allowance after transfer", async () => {
      const amount = ethers.parseEther("500");
      const recipient = ethers.Wallet.createRandom().address;

      await lpToken.connect(user).transferFrom(owner.address, recipient, amount);

      expect(await lpToken.allowance(owner.address, user.address)).to.equal(0);
    });

    it("Should emit Transfer event", async () => {
      const amount = ethers.parseEther("500");
      const recipient = ethers.Wallet.createRandom().address;

      await expect(
        lpToken.connect(user).transferFrom(owner.address, recipient, amount)
      )
        .to.emit(lpToken, "Transfer")
        .withArgs(owner.address, recipient, amount);
    });
  });

  describe("Balance Queries", () => {
    beforeEach(async () => {
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
      await lpToken.connect(factory).mint(user.address, ethers.parseEther("500"));
    });

    it("Should return correct balance for owner", async () => {
      expect(await lpToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should return correct balance for user", async () => {
      expect(await lpToken.balanceOf(user.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should return zero balance for non-existent account", async () => {
      const randomAddress = ethers.Wallet.createRandom().address;
      expect(await lpToken.balanceOf(randomAddress)).to.equal(0);
    });
  });

  describe("Total Supply", () => {
    it("Should return zero initially", async () => {
      expect(await lpToken.totalSupply()).to.equal(0);
    });

    it("Should increase on mint", async () => {
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
      expect(await lpToken.totalSupply()).to.equal(ethers.parseEther("1000"));

      await lpToken.connect(factory).mint(user.address, ethers.parseEther("500"));
      expect(await lpToken.totalSupply()).to.equal(ethers.parseEther("1500"));
    });

    it("Should decrease on burn", async () => {
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
      await lpToken.connect(factory).burn(owner.address, ethers.parseEther("500"));
      expect(await lpToken.totalSupply()).to.equal(ethers.parseEther("500"));
    });
  });

  describe("Allowance Queries", () => {
    it("Should return zero allowance initially", async () => {
      expect(await lpToken.allowance(owner.address, user.address)).to.equal(0);
    });

    it("Should return correct allowance after approve", async () => {
      const amount = ethers.parseEther("500");
      await lpToken.approve(user.address, amount);
      expect(await lpToken.allowance(owner.address, user.address)).to.equal(amount);
    });

    it("Should return updated allowance after transferFrom", async () => {
      const amount = ethers.parseEther("500");
      await lpToken.connect(factory).mint(owner.address, ethers.parseEther("1000"));
      await lpToken.approve(user.address, amount);

      const recipient = ethers.Wallet.createRandom().address;
      await lpToken.connect(user).transferFrom(owner.address, recipient, ethers.parseEther("250"));

      expect(await lpToken.allowance(owner.address, user.address)).to.equal(ethers.parseEther("250"));
    });
  });

  describe("IncreaseAllowance", () => {
    beforeEach(async () => {
      await lpToken.approve(user.address, ethers.parseEther("500"));
    });

    it("Should increase allowance", async () => {
      const addedValue = ethers.parseEther("300");
      await lpToken.increaseAllowance(user.address, addedValue);

      expect(await lpToken.allowance(owner.address, user.address)).to.equal(ethers.parseEther("800"));
    });

    it("Should revert with zero address", async () => {
      const addedValue = ethers.parseEther("300");

      await expect(
        lpToken.increaseAllowance(ethers.ZeroAddress, addedValue)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });

    it("Should emit Approval event", async () => {
      const addedValue = ethers.parseEther("300");

      await expect(
        lpToken.increaseAllowance(user.address, addedValue)
      )
        .to.emit(lpToken, "Approval")
        .withArgs(owner.address, user.address, ethers.parseEther("800"));
    });
  });

  describe("DecreaseAllowance", () => {
    beforeEach(async () => {
      await lpToken.approve(user.address, ethers.parseEther("500"));
    });

    it("Should decrease allowance", async () => {
      const subtractedValue = ethers.parseEther("300");
      await lpToken.decreaseAllowance(user.address, subtractedValue);

      expect(await lpToken.allowance(owner.address, user.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should revert with insufficient allowance", async () => {
      const subtractedValue = ethers.parseEther("1000");

      await expect(
        lpToken.decreaseAllowance(user.address, subtractedValue)
      ).to.be.revertedWith("ERC20: decreased allowance below zero");
    });

    it("Should revert with zero address", async () => {
      const subtractedValue = ethers.parseEther("300");

      await expect(
        lpToken.decreaseAllowance(ethers.ZeroAddress, subtractedValue)
      ).to.be.revertedWith("ERC20: approve from the zero address");
    });

    it("Should emit Approval event", async () => {
      const subtractedValue = ethers.parseEther("300");

      await expect(
        lpToken.decreaseAllowance(user.address, subtractedValue)
      )
        .to.emit(lpToken, "Approval")
        .withArgs(owner.address, user.address, ethers.parseEther("200"));
    });
  });
});
