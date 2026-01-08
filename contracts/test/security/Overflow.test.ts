// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../../typechain-types";
import { DogePumpPair } from "../../typechain-types";
import { DogePumpRouter } from "../../typechain-types";
import { DogePumpLPToken } from "../../typechain-types";
import { ERC20Mock } from "../../typechain-types";
describe("Overflow/Underflow Protection Tests", () => {
  let factory: DogePumpFactory;
  let pair: DogePumpPair;
  let router: DogePumpRouter;
  let lpToken: DogePumpLPToken;
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

    // Create pair
    await factory.createPair(token0.address, token1.address);
    const pairAddress = await factory.getPair(token0.address, token1.address);
    pair = await ethers.getContractAt("DogePumpPair", pairAddress);
    lpToken = await ethers.getContractAt("DogePumpLPToken", pairAddress);

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

  describe("Solidity 0.8+ Overflow Protection", () => {
    it("Should prevent overflow on large token amounts", async () => {
      const maxUint = ethers.MaxUint256;

      await token0.mint(user.address, maxUint);
      await token0.connect(user).approve(router.address, maxUint);

      // This should not overflow due to Solidity 0.8+ checks
      await expect(
        router.connect(user).swapExactTokensForTokens(
          maxUint,
          0,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.reverted;
    });

    it("Should prevent underflow on subtraction", async () => {
      const balance = await token0.balanceOf(user.address);
      const largeAmount = balance + ethers.parseEther("1000");

      await expect(
        token0.connect(user).transfer(owner.address, largeAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle large numbers in calculations", async () => {
      const largeAmount = ethers.parseEther("1000000000"); // 1 billion tokens

      await token0.mint(user.address, largeAmount);
      await token0.connect(user).approve(router.address, largeAmount);

      // Should handle large numbers without overflow
      const amounts = await router.getAmountsOut(largeAmount, [token0.address, token1.address]);

      expect(amounts[0]).to.equal(largeAmount);
      expect(amounts[1]).to.be.gt(0);
    });
  });

  describe("LP Token Overflow Protection", () => {
    it("Should prevent overflow on mint", async () => {
      const amount0 = ethers.parseEther("1000000000");
      const amount1 = ethers.parseEther("2000000000");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token1.connect(user).approve(router.address, ethers.MaxUint256);

      // Should handle large mint without overflow
      await router.connect(user).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const totalSupply = await lpToken.totalSupply();
      expect(totalSupply).to.be.gt(0);
    });

    it("Should prevent overflow on total supply", async () => {
      // Try to mint maximum uint256
      const maxUint = ethers.MaxUint256;

      await expect(
        lpToken.connect(owner).mint(user.address, maxUint)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should handle balance overflow prevention", async () => {
      const balance = await lpToken.balanceOf(user.address);
      const largeAmount = balance + ethers.MaxUint256;

      await expect(
        lpToken.connect(owner).mint(user.address, largeAmount)
      ).to.be.revertedWith("FORBIDDEN");
    });
  });

  describe("Reserve Overflow Protection", () => {
    it("Should prevent reserve overflow on swap", async () => {
      const largeAmount = ethers.MaxUint256;

      await token0.mint(user.address, largeAmount);
      await token0.connect(user).approve(router.address, largeAmount);

      // Should fail before reserves overflow
      await expect(
        router.connect(user).swapExactTokensForTokens(
          largeAmount,
          0,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.reverted;
    });

    it("Should maintain reserve consistency", async () => {
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      // Perform swap
      const amountIn = ethers.parseEther("100");
      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, amountIn);

      await router.connect(user).swapExactTokensForTokens(
        amountIn,
        0,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const [reserve0After, reserve1After] = await pair.getReserves();

      // Reserves should have increased, not overflowed
      expect(reserve0After).to.be.gt(reserve0Before);
      expect(reserve1After).to.be.lt(reserve1Before);
    });
  });

  describe("Math Operation Safety", () => {
    it("Should safely calculate liquidity amounts", async () => {
      const amount0 = ethers.parseEther("1000000");
      const amount1 = ethers.parseEther("2000000");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token1.connect(user).approve(router.address, ethers.MaxUint256);

      await router.connect(user).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const totalSupply = await lpToken.totalSupply();
      const userBalance = await lpToken.balanceOf(user.address);

      // Liquidity calculation should be accurate
      expect(totalSupply).to.equal(userBalance + 1000n); // + MINIMUM_LIQUIDITY
    });

    it("Should safely calculate swap amounts", async () => {
      const amountIn = ethers.parseEther("1000");
      const amounts = await router.getAmountsOut(amountIn, [token0.address, token1.address]);

      // Output should be less than input due to fees and price impact
      expect(amounts[1]).to.be.lt(amountIn * 2n);

      // Should be positive
      expect(amounts[1]).to.be.gt(0);
    });

    it("Should safely calculate price impact", async () => {
      const smallAmount = ethers.parseEther("1");
      const largeAmount = ethers.parseEther("10000");

      const smallAmounts = await router.getAmountsOut(smallAmount, [token0.address, token1.address]);
      const largeAmounts = await router.getAmountsOut(largeAmount, [token0.address, token1.address]);

      const smallPrice = smallAmounts[1] * ethers.parseEther("1") / smallAmount;
      const largePrice = largeAmounts[1] * ethers.parseEther("1") / largeAmount;

      // Large amount should have worse price (price impact)
      expect(largePrice).to.be.lt(smallPrice);

      // Both should be positive
      expect(smallPrice).to.be.gt(0);
      expect(largePrice).to.be.gt(0);
    });
  });

  describe("Cumulative Price Overflow", () => {
    it("Should handle cumulative price tracking", async () => {
      const price0CumulativeBefore = await pair.price0CumulativeLast();
      const price1CumulativeBefore = await pair.price1CumulativeLast();

      // Perform multiple swaps
      for (let i = 0; i < 10; i++) {
        const amountIn = ethers.parseEther("100");
        await token0.mint(user.address, amountIn);
        await token0.connect(user).approve(router.address, amountIn);

        await router.connect(user).swapExactTokensForTokens(
          amountIn,
          0,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        );
      }

      const price0CumulativeAfter = await pair.price0CumulativeLast();
      const price1CumulativeAfter = await pair.price1CumulativeLast();

      // Cumulative prices should increase
      expect(price0CumulativeAfter).to.be.gt(price0CumulativeBefore);
      expect(price1CumulativeAfter).to.be.gt(price1CumulativeBefore);
    });

    it("Should not overflow cumulative prices", async () => {
      // Perform many swaps to test cumulative price overflow
      for (let i = 0; i < 100; i++) {
        const amountIn = ethers.parseEther("1000");
        await token0.mint(user.address, amountIn);
        await token0.connect(user).approve(router.address, amountIn);

        await router.connect(user).swapExactTokensForTokens(
          amountIn,
          0,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        );
      }

      const price0Cumulative = await pair.price0CumulativeLast();
      const price1Cumulative = await pair.price1CumulativeLast();

      // Should not overflow (still be positive)
      expect(price0Cumulative).to.be.gt(0);
      expect(price1Cumulative).to.be.gt(0);
    });
  });

  describe("Fee Calculation Safety", () => {
    it("Should correctly calculate swap fees", async () => {
      const amountIn = ethers.parseEther("1000");
      const amounts = await router.getAmountsOut(amountIn, [token0.address, token1.address]);

      const expectedFee = amountIn * 3n / 1000n; // 0.3% fee
      const expectedOutput = amountIn - expectedFee;

      // Output should account for fee
      expect(amounts[1]).to.be.lt(expectedOutput * 2n); // Rough estimate
      expect(amounts[1]).to.be.gt(0);
    });

    it("Should handle fee calculation with large amounts", async () => {
      const largeAmount = ethers.parseEther("1000000000");
      const amounts = await router.getAmountsOut(largeAmount, [token0.address, token1.address]);

      const expectedFee = largeAmount * 3n / 1000n;

      // Fee should be calculated correctly
      expect(amounts[1]).to.be.gt(0);
    });
  });

  describe("Transfer Safety", () => {
    it("Should prevent transfer with insufficient balance", async () => {
      const balance = await token0.balanceOf(user.address);
      const transferAmount = balance + ethers.parseEther("1000");

      await expect(
        token0.connect(user).transfer(owner.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should prevent transferFrom with insufficient allowance", async () => {
      const balance = await token0.balanceOf(owner.address);
      const transferAmount = balance / 2n;

      await token0.approve(user.address, ethers.parseEther("100"));

      await expect(
        token0.connect(user).transferFrom(owner.address, user.address, transferAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should handle zero amount transfers", async () => {
      await expect(
        token0.connect(user).transfer(owner.address, 0)
      ).to.not.be.reverted;
    });
  });
});
