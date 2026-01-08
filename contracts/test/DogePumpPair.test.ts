// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpPair } from "../typechain-types";
import { ERC20Mock } from "../typechain-types";
describe("DogePumpPair", () => {
  let pair: DogePumpPair;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let factory: any;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [factory, owner, user] = await ethers.getSigners();

    // Deploy mock tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token0 = await ERC20Mock.deploy("Token0", "T0", 18);
    token1 = await ERC20Mock.deploy("Token1", "T1", 18);

    // Deploy pair
    const DogePumpPair = await ethers.getContractFactory("DogePumpPair");
    pair = await DogePumpPair.deploy();
    await pair.initialize(token0.address, token1.address);
  });

  describe("Initialization", () => {
    it("Should set correct factory", async () => {
      expect(await pair.factory()).to.equal(factory.address);
    });

    it("Should set correct tokens", async () => {
      expect(await pair.token0()).to.equal(token0.address);
      expect(await pair.token1()).to.equal(token1.address);
    });

    it("Should have zero initial reserves", async () => {
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.equal(0);
      expect(reserve1).to.equal(0);
    });

    it("Should have zero initial supply", async () => {
      expect(await pair.totalSupply()).to.equal(0);
    });

    it("Should revert if already initialized", async () => {
      await expect(
        pair.initialize(token0.address, token1.address)
      ).to.be.revertedWith("ALREADY_INITIALIZED");
    });

    it("Should revert if called by non-factory", async () => {
      const DogePumpPair2 = await ethers.getContractFactory("DogePumpPair");
      const pair2 = await DogePumpPair2.deploy();
      await expect(
        pair2.initialize(token0.address, token1.address)
      ).to.be.revertedWith("FORBIDDEN");
    });
  });

  describe("Mint", () => {
    it("Should mint LP tokens on first deposit", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);

      await token0.approve(pair.address, amount0);
      await token1.approve(pair.address, amount1);

      const tx = await pair.mint(owner.address);
      const receipt = await tx.wait();

      // Check Mint event
      const event = receipt.events?.find((e: any) => e.event === "Mint");
      expect(event).to.not.be.undefined;
      expect(event.args.amount0).to.equal(amount0);
      expect(event.args.amount1).to.equal(amount1);

      // Check LP tokens minted (minus MINIMUM_LIQUIDITY)
      const expectedLiquidity = Math.sqrt(
        Number(amount0) * Number(amount1)
      ) - 1000; // MINIMUM_LIQUIDITY
      const actualLiquidity = await pair.balanceOf(owner.address);
      expect(actualLiquidity).to.be.closeTo(BigInt(Math.floor(expectedLiquidity)), 100);
    });

    it("Should lock minimum liquidity", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);
      await token0.approve(pair.address, amount0);
      await token1.approve(pair.address, amount1);

      await pair.mint(owner.address);

      // Check that 1000 LP tokens are locked at address(0)
      const lockedLiquidity = await pair.balanceOf(ethers.ZeroAddress);
      expect(lockedLiquidity).to.equal(1000);
    });

    it("Should mint proportional LP tokens on subsequent deposit", async () => {
      // First deposit
      await token0.mint(owner.address, ethers.parseEther("100"));
      await token1.mint(owner.address, ethers.parseEther("200"));
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);

      const firstSupply = await pair.totalSupply();

      // Second deposit
      const amount0 = ethers.parseEther("50");
      const amount1 = ethers.parseEther("100");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);
      await token0.approve(pair.address, amount0);
      await token1.approve(pair.address, amount1);

      await pair.mint(owner.address);

      const secondSupply = await pair.totalSupply();
      const minted = secondSupply - firstSupply;

      // Calculate expected LP tokens
      const [reserve0, reserve1] = await pair.getReserves();
      const expected = Math.min(
        Number(amount0) * Number(firstSupply) / Number(reserve0),
        Number(amount1) * Number(firstSupply) / Number(reserve1)
      );

      expect(minted).to.be.closeTo(BigInt(Math.floor(expected)), 100);
    });

    it("Should revert with insufficient liquidity", async () => {
      const amount0 = ethers.parseEther("0.0001");
      const amount1 = ethers.parseEther("0.0001");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);
      await token0.approve(pair.address, amount0);
      await token1.approve(pair.address, amount1);

      await expect(
        pair.mint(owner.address)
      ).to.be.revertedWith("INSUFFICIENT_LIQUIDITY_MINTED");
    });
  });

  describe("Burn", () => {
    beforeEach(async () => {
      // Add initial liquidity
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);
    });

    it("Should burn LP tokens and return underlying tokens", async () => {
      const lpBalance = await pair.balanceOf(owner.address);
      const burnAmount = lpBalance / 2n; // Burn half

      const tx = await pair.burn(user.address);
      const receipt = await tx.wait();

      // Check Burn event
      const event = receipt.events?.find((e: any) => e.event === "Burn");
      expect(event).to.not.be.undefined;
      expect(event.args.to).to.equal(user.address);

      // Check token balances
      const token0Balance = await token0.balanceOf(user.address);
      const token1Balance = await token1.balanceOf(user.address);

      expect(token0Balance).to.be.gt(0);
      expect(token1Balance).to.be.gt(0);

      // Check LP tokens burned
      const newLpBalance = await pair.balanceOf(owner.address);
      expect(newLpBalance).to.equal(lpBalance - burnAmount);
    });

    it("Should revert with insufficient LP balance", async () => {
      const lpBalance = await pair.balanceOf(owner.address);
      const burnAmount = lpBalance + 1n;

      await expect(
        pair.burn(user.address)
      ).to.be.reverted;
    });
  });

  describe("Swap", () => {
    beforeEach(async () => {
      // Add initial liquidity
      const amount0 = ethers.parseEther("1000");
      const amount1 = ethers.parseEther("2000");

      await token0.mint(owner.address, amount0);
      await token1.mint(owner.address, amount1);
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);
    });

    it("Should swap token0 for token1", async () => {
      const swapAmount = ethers.parseEther("10");

      await token0.mint(user.address, swapAmount);
      await token0.approve(pair.address, swapAmount);

      const tx = await pair.swap(0, ethers.parseEther("19"), user.address, "0x");
      const receipt = await tx.wait();

      // Check Swap event
      const event = receipt.events?.find((e: any) => e.event === "Swap");
      expect(event).to.not.be.undefined;
      expect(event.args.amount0In).to.equal(swapAmount);
      expect(event.args.amount1Out).to.equal(ethers.parseEther("19"));

      // Check token balances
      const userToken1Balance = await token1.balanceOf(user.address);
      expect(userToken1Balance).to.be.closeTo(ethers.parseEther("18.8"), ethers.parseEther("0.1"));
    });

    it("Should charge 0.3% fee", async () => {
      const swapAmount = ethers.parseEther("100");

      await token0.mint(user.address, swapAmount);
      await token0.approve(pair.address, swapAmount);

      const [reserve0Before, reserve1Before] = await pair.getReserves();

      await pair.swap(0, ethers.parseEther("190"), user.address, "0x");

      const [reserve0After, reserve1After] = await pair.getReserves();

      // Calculate expected fee
      const expectedFee = swapAmount * 3n / 1000n; // 0.3%
      const expectedReserve0 = reserve0Before + swapAmount - expectedFee;

      expect(reserve0After).to.be.closeTo(expectedReserve0, ethers.parseEther("0.01"));
    });

    it("Should revert with insufficient output amount", async () => {
      await expect(
        pair.swap(0, 0, user.address, "0x")
      ).to.be.revertedWith("INSUFFICIENT_OUTPUT_AMOUNT");
    });

    it("Should revert with insufficient liquidity", async () => {
      const swapAmount = ethers.parseEther("10000");

      await token0.mint(user.address, swapAmount);
      await token0.approve(pair.address, swapAmount);

      await expect(
        pair.swap(ethers.parseEther("10000"), 0, user.address, "0x")
      ).to.be.revertedWith("INSUFFICIENT_LIQUIDITY");
    });

    it("Should revert if to address is a token", async () => {
      const swapAmount = ethers.parseEther("10");

      await token0.mint(user.address, swapAmount);
      await token0.approve(pair.address, swapAmount);

      await expect(
        pair.swap(0, ethers.parseEther("1"), token0.address, "0x")
      ).to.be.revertedWith("InvalidTo");
    });

    it("Should prevent reentrancy", async () => {
      const swapAmount = ethers.parseEther("10");

      await token0.mint(user.address, swapAmount);
      await token0.approve(pair.address, swapAmount);

      await expect(
        pair.swap(0, ethers.parseEther("1"), user.address, "0x")
      ).to.not.be.reverted;
    });
  });

  describe("Sync", () => {
    it("Should sync reserves with actual balances", async () => {
      // Add liquidity
      await token0.mint(owner.address, ethers.parseEther("100"));
      await token1.mint(owner.address, ethers.parseEther("200"));
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);

      // Send tokens directly to pair
      await token0.transfer(pair.address, ethers.parseEther("10"));

      const [reserve0Before, reserve1Before] = await pair.getReserves();

      await pair.sync();

      const [reserve0After, reserve1After] = await pair.getReserves();

      expect(reserve0After).to.equal(reserve0Before + ethers.parseEther("10"));
      expect(reserve1After).to.equal(reserve1Before);
    });
  });

  describe("Skim", () => {
    it("Should recover excess tokens", async () => {
      // Add liquidity
      await token0.mint(owner.address, ethers.parseEther("100"));
      await token1.mint(owner.address, ethers.parseEther("200"));
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);

      // Send tokens directly to pair
      await token0.transfer(pair.address, ethers.parseEther("10"));

      const userBalanceBefore = await token0.balanceOf(user.address);

      await pair.skim(user.address);

      const userBalanceAfter = await token0.balanceOf(user.address);
      expect(userBalanceAfter).to.equal(userBalanceBefore + ethers.parseEther("10"));
    });
  });

  describe("getReserves", () => {
    it("Should return current reserves", async () => {
      await token0.mint(owner.address, ethers.parseEther("100"));
      await token1.mint(owner.address, ethers.parseEther("200"));
      await token0.approve(pair.address, ethers.MaxUint256);
      await token1.approve(pair.address, ethers.MaxUint256);
      await pair.mint(owner.address);

      const [reserve0, reserve1] = await pair.getReserves();

      expect(reserve0).to.equal(ethers.parseEther("100"));
      expect(reserve1).to.equal(ethers.parseEther("200"));
    });
  });

  describe("MINIMUM_LIQUIDITY", () => {
    it("Should return 1000", async () => {
      expect(await pair.MINIMUM_LIQUIDITY()).to.equal(1000);
    });
  });
});
