// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { GraduationManager } from "../typechain-types";
import { DogePumpFactory } from "../typechain-types";
import { DogePumpRouter } from "../typechain-types";
import { DogePumpPair } from "../typechain-types";
import { ERC20Mock } from "../typechain-types";
describe("GraduationManager", () => {
  let graduationManager: GraduationManager;
  let factory: DogePumpFactory;
  let router: DogePumpRouter;
  let weth: ERC20Mock;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mock tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    weth = await ERC20Mock.deploy("Wrapped Ether", "WETH", 18);
    token0 = await ERC20Mock.deploy("Token0", "T0", 18);
    token1 = await ERC20Mock.deploy("Token1", "T1", 18);

    // Deploy factory
    const DogePumpFactory = await ethers.getContractFactory("DogePumpFactory");
    factory = await DogePumpFactory.deploy(owner.address);

    // Deploy router
    const DogePumpRouter = await ethers.getContractFactory("DogePumpRouter");
    router = await DogePumpRouter.deploy(factory.address, weth.address);

    // Deploy graduation manager
    const GraduationManager = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManager.deploy(factory.address, router.address, owner.address);
  });

  describe("Deployment", () => {
    it("Should set correct factory", async () => {
      expect(await graduationManager.factory()).to.equal(factory.address);
    });

    it("Should set correct router", async () => {
      expect(await graduationManager.router()).to.equal(router.address);
    });

    it("Should set correct owner", async () => {
      expect(await graduationManager.owner()).to.equal(owner.address);
    });

    it("Should set default graduation threshold", async () => {
      expect(await graduationManager.graduationThreshold()).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("setGraduationThreshold", () => {
    it("Should allow owner to set graduation threshold", async () => {
      const newThreshold = ethers.parseEther("500000");

      const tx = await graduationManager.setGraduationThreshold(newThreshold);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "ThresholdUpdated");
      expect(event).to.not.be.undefined;
      expect(event.args.oldThreshold).to.equal(ethers.parseEther("1000000"));
      expect(event.args.newThreshold).to.equal(newThreshold);

      expect(await graduationManager.graduationThreshold()).to.equal(newThreshold);
    });

    it("Should revert if called by non-owner", async () => {
      const newThreshold = ethers.parseEther("500000");

      await expect(
        graduationManager.connect(user).setGraduationThreshold(newThreshold)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert with zero threshold", async () => {
      await expect(
        graduationManager.setGraduationThreshold(0)
      ).to.be.revertedWith("ZeroThreshold");
    });

    it("Should emit ThresholdUpdated event", async () => {
      const newThreshold = ethers.parseEther("500000");

      await expect(
        graduationManager.setGraduationThreshold(newThreshold)
      )
        .to.emit(graduationManager, "ThresholdUpdated")
        .withArgs(ethers.parseEther("1000000"), newThreshold);
    });
  });

  describe("checkGraduation", () => {
    it("Should return false for token below threshold", async () => {
      const isGraduated = await graduationManager.checkGraduation(token0.address);
      expect(isGraduated).to.equal(false);
    });

    it("Should return true for token above threshold", async () => {
      // Mint tokens to token0 contract to simulate market cap
      await token0.mint(token0.address, ethers.parseEther("2000000"));

      const isGraduated = await graduationManager.checkGraduation(token0.address);
      expect(isGraduated).to.equal(true);
    });

    it("Should return false for token at threshold", async () => {
      await token0.mint(token0.address, ethers.parseEther("1000000"));

      const isGraduated = await graduationManager.checkGraduation(token0.address);
      expect(isGraduated).to.equal(false);
    });
  });

  describe("executeGraduation", () => {
    beforeEach(async () => {
      // Create a pair for graduation
      await factory.createPair(weth.address, token0.address);
      const pairAddress = await factory.getPair(weth.address, token0.address);
      const pair = await ethers.getContractAt("DogePumpPair", pairAddress);

      // Add liquidity to simulate market
      const amountWETH = ethers.parseEther("100");
      const amountToken = ethers.parseEther("1000000");

      await weth.mint(owner.address, amountWETH);
      await token0.mint(owner.address, amountToken);
      await weth.approve(router.address, ethers.MaxUint256);
      await token0.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        weth.address,
        token0.address,
        amountWETH,
        amountToken,
        amountWETH,
        amountToken,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should execute graduation for qualified token", async () => {
      const tx = await graduationManager.executeGraduation(token0.address);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "GraduationExecuted");
      expect(event).to.not.be.undefined;
      expect(event.args.token).to.equal(token0.address);
    });

    it("Should revert if token not graduated", async () => {
      await expect(
        graduationManager.executeGraduation(token1.address)
      ).to.be.revertedWith("TokenNotGraduated");
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).executeGraduation(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit GraduationExecuted event", async () => {
      await expect(
        graduationManager.executeGraduation(token0.address)
      )
        .to.emit(graduationManager, "GraduationExecuted")
        .withArgs(token0.address);
    });
  });

  describe("createAMMPool", () => {
    beforeEach(async () => {
      // Create pair for testing
      await factory.createPair(weth.address, token0.address);
      const pairAddress = await factory.getPair(weth.address, token0.address);
      const pair = await ethers.getContractAt("DogePumpPair", pairAddress);

      const amountWETH = ethers.parseEther("100");
      const amountToken = ethers.parseEther("1000000");

      await weth.mint(owner.address, amountWETH);
      await token0.mint(owner.address, amountToken);
      await weth.approve(router.address, ethers.MaxUint256);
      await token0.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        weth.address,
        token0.address,
        amountWETH,
        amountToken,
        amountWETH,
        amountToken,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should create AMM pool for graduated token", async () => {
      const tx = await graduationManager.createAMMPool(token0.address);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "AMMPoolCreated");
      expect(event).to.not.be.undefined;
      expect(event.args.token).to.equal(token0.address);
    });

    it("Should revert if token not graduated", async () => {
      await expect(
        graduationManager.createAMMPool(token1.address)
      ).to.be.revertedWith("TokenNotGraduated");
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).createAMMPool(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit AMMPoolCreated event", async () => {
      await expect(
        graduationManager.createAMMPool(token0.address)
      )
        .to.emit(graduationManager, "AMMPoolCreated")
        .withArgs(token0.address);
    });
  });

  describe("migrateLiquidity", () => {
    beforeEach(async () => {
      await factory.createPair(weth.address, token0.address);
      const pairAddress = await factory.getPair(weth.address, token0.address);
      const pair = await ethers.getContractAt("DogePumpPair", pairAddress);

      const amountWETH = ethers.parseEther("100");
      const amountToken = ethers.parseEther("1000000");

      await weth.mint(owner.address, amountWETH);
      await token0.mint(owner.address, amountToken);
      await weth.approve(router.address, ethers.MaxUint256);
      await token0.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        weth.address,
        token0.address,
        amountWETH,
        amountToken,
        amountWETH,
        amountToken,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should migrate liquidity to AMM pool", async () => {
      const tx = await graduationManager.migrateLiquidity(token0.address);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "LiquidityMigrated");
      expect(event).to.not.be.undefined;
      expect(event.args.token).to.equal(token0.address);
    });

    it("Should revert if token not graduated", async () => {
      await expect(
        graduationManager.migrateLiquidity(token1.address)
      ).to.be.revertedWith("TokenNotGraduated");
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).migrateLiquidity(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit LiquidityMigrated event", async () => {
      await expect(
        graduationManager.migrateLiquidity(token0.address)
      )
        .to.emit(graduationManager, "LiquidityMigrated")
        .withArgs(token0.address);
    });
  });

  describe("burnBondingCurveTokens", () => {
    beforeEach(async () => {
      await factory.createPair(weth.address, token0.address);
      const pairAddress = await factory.getPair(weth.address, token0.address);
      const pair = await ethers.getContractAt("DogePumpPair", pairAddress);

      const amountWETH = ethers.parseEther("100");
      const amountToken = ethers.parseEther("1000000");

      await weth.mint(owner.address, amountWETH);
      await token0.mint(owner.address, amountToken);
      await weth.approve(router.address, ethers.MaxUint256);
      await token0.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        weth.address,
        token0.address,
        amountWETH,
        amountToken,
        amountWETH,
        amountToken,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should burn bonding curve tokens", async () => {
      const totalSupplyBefore = await token0.totalSupply();

      const tx = await graduationManager.burnBondingCurveTokens(token0.address);
      const receipt = await tx.wait();

      const totalSupplyAfter = await token0.totalSupply();

      expect(totalSupplyAfter).to.be.lt(totalSupplyBefore);
    });

    it("Should revert if token not graduated", async () => {
      await expect(
        graduationManager.burnBondingCurveTokens(token1.address)
      ).to.be.revertedWith("TokenNotGraduated");
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).burnBondingCurveTokens(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("setOwner", () => {
    it("Should allow owner to transfer ownership", async () => {
      await graduationManager.transferOwnership(user.address);

      expect(await graduationManager.owner()).to.equal(user.address);
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).transferOwnership(user.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert with zero address", async () => {
      await expect(
        graduationManager.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });
  });

  describe("renounceOwnership", () => {
    it("Should allow owner to renounce ownership", async () => {
      await graduationManager.renounceOwnership();

      expect(await graduationManager.owner()).to.equal(ethers.ZeroAddress);
    });

    it("Should revert if called by non-owner", async () => {
      await expect(
        graduationManager.connect(user).renounceOwnership()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("getGraduationStatus", () => {
    it("Should return graduation status for token", async () => {
      const status = await graduationManager.getGraduationStatus(token0.address);

      expect(status.isGraduated).to.equal(false);
      expect(status.currentSupply).to.equal(0);
      expect(status.threshold).to.equal(ethers.parseEther("1000000"));
    });

    it("Should return correct status for graduated token", async () => {
      await token0.mint(token0.address, ethers.parseEther("2000000"));

      const status = await graduationManager.getGraduationStatus(token0.address);

      expect(status.isGraduated).to.equal(true);
      expect(status.currentSupply).to.equal(ethers.parseEther("2000000"));
      expect(status.threshold).to.equal(ethers.parseEther("1000000"));
    });
  });
});
