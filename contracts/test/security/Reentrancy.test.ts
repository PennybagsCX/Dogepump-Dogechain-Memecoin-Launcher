// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../../typechain-types";
import { DogePumpPair } from "../../typechain-types";
import { DogePumpRouter } from "../../typechain-types";
import { ERC20Mock } from "../../typechain-types";
describe("Reentrancy Security Tests", () => {
  let factory: DogePumpFactory;
  let pair: DogePumpPair;
  let router: DogePumpRouter;
  let weth: ERC20Mock;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let owner: any;
  let attacker: any;

  beforeEach(async () => {
    [owner, attacker] = await ethers.getSigners();

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

    // Create pair
    await factory.createPair(token0.address, token1.address);
    const pairAddress = await factory.getPair(token0.address, token1.address);
    pair = await ethers.getContractAt("DogePumpPair", pairAddress);

    // Add initial liquidity
    const amount0 = ethers.parseEther("1000");
    const amount1 = ethers.parseEther("2000");

    await token0.mint(owner.address, amount0);
    await token1.mint(owner.address, amount1);
    await token0.approve(router.address, ethers.MaxUint256);
    await token1.approve(router.address, ethers.MaxUint256);

    await router.addLiquidity(
      token0.address,
      token1.address,
      amount0,
      amount1,
      amount0,
      amount1,
      owner.address,
      Math.floor(Date.now() / 1000) + 3600
    );
  });

  describe("Pair Reentrancy Protection", () => {
    it("Should prevent reentrancy on swap", async () => {
      // Deploy malicious contract that attempts reentrancy
      const MaliciousContract = await ethers.getContractFactory("MaliciousReentrancyAttacker");
      const malicious = await MaliciousContract.deploy(pair.address, token0.address, token1.address);

      // Give malicious contract some tokens
      const attackAmount = ethers.parseEther("10");
      await token0.mint(malicious.address, attackAmount);

      // Attempt reentrancy attack
      await expect(
        malicious.attack(attackAmount)
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on mint", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousMintReentrancy");
      const malicious = await MaliciousContract.deploy(pair.address, token0.address, token1.address);

      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(malicious.address, amount0);
      await token1.mint(malicious.address, amount1);

      await expect(
        malicious.attackMint(amount0, amount1)
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on burn", async () => {
      // First give attacker some LP tokens
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(attacker.address, amount0);
      await token1.mint(attacker.address, amount1);
      await token0.connect(attacker).approve(router.address, ethers.MaxUint256);
      await token1.connect(attacker).approve(router.address, ethers.MaxUint256);

      await router.connect(attacker).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        0,
        0,
        attacker.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const MaliciousContract = await ethers.getContractFactory("MaliciousBurnReentrancy");
      const malicious = await MaliciousContract.deploy(pair.address);

      const lpBalance = await pair.balanceOf(attacker.address);
      await pair.connect(attacker).transfer(malicious.address, lpBalance);

      await expect(
        malicious.attackBurn(lpBalance)
      ).to.be.reverted;
    });
  });

  describe("Router Reentrancy Protection", () => {
    it("Should prevent reentrancy on swapExactTokensForTokens", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousRouterReentrancy");
      const malicious = await MaliciousContract.deploy(router.address, token0.address, token1.address);

      const amountIn = ethers.parseEther("10");
      await token0.mint(malicious.address, amountIn);
      await token0.connect(malicious).approve(router.address, ethers.MaxUint256);

      await expect(
        malicious.attackSwap(amountIn)
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on addLiquidity", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousLiquidityReentrancy");
      const malicious = await MaliciousContract.deploy(router.address, token0.address, token1.address);

      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(malicious.address, amount0);
      await token1.mint(malicious.address, amount1);
      await token0.connect(malicious).approve(router.address, ethers.MaxUint256);
      await token1.connect(malicious).approve(router.address, ethers.MaxUint256);

      await expect(
        malicious.attackAddLiquidity(amount0, amount1)
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on removeLiquidity", async () => {
      // First give attacker liquidity
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(attacker.address, amount0);
      await token1.mint(attacker.address, amount1);
      await token0.connect(attacker).approve(router.address, ethers.MaxUint256);
      await token1.connect(attacker).approve(router.address, ethers.MaxUint256);

      await router.connect(attacker).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        0,
        0,
        attacker.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const MaliciousContract = await ethers.getContractFactory("MaliciousRemoveLiquidityReentrancy");
      const malicious = await MaliciousContract.deploy(router.address, token0.address, token1.address, pair.address);

      const lpBalance = await pair.balanceOf(attacker.address);
      await pair.connect(attacker).transfer(malicious.address, lpBalance);
      await pair.connect(malicious).approve(router.address, ethers.MaxUint256);

      await expect(
        malicious.attackRemoveLiquidity(lpBalance)
      ).to.be.reverted;
    });
  });

  describe("Factory Reentrancy Protection", () => {
    it("Should prevent reentrancy on createPair", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousFactoryReentrancy");
      const malicious = await MaliciousContract.deploy(factory.address);

      await expect(
        malicious.attackCreatePair(token0.address, token1.address)
      ).to.be.reverted;
    });

    it("Should prevent reentrancy on setFeeTo", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousFeeToReentrancy");
      const malicious = await MaliciousContract.deploy(factory.address);

      await expect(
        malicious.attackSetFeeTo(attacker.address)
      ).to.be.reverted;
    });
  });

  describe("Cross-Function Reentrancy", () => {
    it("Should prevent swap calling mint", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousSwapMintReentrancy");
      const malicious = await MaliciousContract.deploy(pair.address, router.address, token0.address, token1.address);

      const amountIn = ethers.parseEther("10");
      await token0.mint(malicious.address, amountIn);
      await token0.connect(malicious).approve(router.address, ethers.MaxUint256);

      await expect(
        malicious.attackSwapMint(amountIn)
      ).to.be.reverted;
    });

    it("Should prevent mint calling burn", async () => {
      const MaliciousContract = await ethers.getContractFactory("MaliciousMintBurnReentrancy");
      const malicious = await MaliciousContract.deploy(pair.address, token0.address, token1.address);

      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(malicious.address, amount0);
      await token1.mint(malicious.address, amount1);

      await expect(
        malicious.attackMintBurn(amount0, amount1)
      ).to.be.reverted;
    });
  });

  describe("State Consistency During Reentrancy", () => {
    it("Should maintain reserve consistency during reentrancy attempt", async () => {
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      const MaliciousContract = await ethers.getContractFactory("MaliciousReentrancyAttacker");
      const malicious = await MaliciousContract.deploy(pair.address, token0.address, token1.address);

      const attackAmount = ethers.parseEther("10");
      await token0.mint(malicious.address, attackAmount);

      try {
        await malicious.attack(attackAmount);
      } catch (e) {
        // Expected to fail
      }

      const [reserve0After, reserve1After] = await pair.getReserves();

      // Reserves should remain unchanged
      expect(reserve0After).to.equal(reserve0Before);
      expect(reserve1After).to.equal(reserve1Before);
    });

    it("Should maintain total supply consistency during reentrancy attempt", async () => {
      const totalSupplyBefore = await pair.totalSupply();

      const MaliciousContract = await ethers.getContractFactory("MaliciousMintReentrancy");
      const malicious = await MaliciousContract.deploy(pair.address, token0.address, token1.address);

      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(malicious.address, amount0);
      await token1.mint(malicious.address, amount1);

      try {
        await malicious.attackMint(amount0, amount1);
      } catch (e) {
        // Expected to fail
      }

      const totalSupplyAfter = await pair.totalSupply();

      // Total supply should remain unchanged
      expect(totalSupplyAfter).to.equal(totalSupplyBefore);
    });
  });
});
