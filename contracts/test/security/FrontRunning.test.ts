// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../../typechain-types";
import { DogePumpPair } from "../../typechain-types";
import { DogePumpRouter } from "../../typechain-types";
import { ERC20Mock } from "../../typechain-types";
describe("Front-Running Mitigation Tests", () => {
  let factory: DogePumpFactory;
  let pair: DogePumpPair;
  let router: DogePumpRouter;
  let weth: ERC20Mock;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let owner: any;
  let user: any;
  let attacker: any;

  beforeEach(async () => {
    [owner, user, attacker] = await ethers.getSigners();

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
    const amount0 = ethers.parseEther("10000");
    const amount1 = ethers.parseEther("20000");

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

  describe("Slippage Protection", () => {
    it("Should protect against price slippage on swap", async () => {
      const amountIn = ethers.parseEther("1000");
      const amountOutMin = ethers.parseEther("1900"); // Realistic slippage

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      // This should succeed
      await router.connect(user).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should revert with excessive slippage", async () => {
      const amountIn = ethers.parseEther("1000");
      const amountOutMin = ethers.parseEther("2500"); // Unrealistic slippage

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    });
  });

  describe("Sandwich Attack Mitigation", () => {
    it("Should mitigate sandwich attack on swap", async () => {
      const victimAmount = ethers.parseEther("1000");
      const attackerAmount = ethers.parseEther("100");

      // Victim prepares swap
      await token0.mint(user.address, victimAmount);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      // Attacker prepares front-run
      await token0.mint(attacker.address, attackerAmount);
      await token0.connect(attacker).approve(router.address, ethers.MaxUint256);

      // Get expected output for victim
      const amountsBefore = await router.getAmountsOut(victimAmount, [token0.address, token1.address]);
      const victimExpectedOut = amountsBefore[1];

      // Attacker front-runs (buys before victim)
      await router.connect(attacker).swapExactTokensForTokens(
        attackerAmount,
        0,
        [token0.address, token1.address],
        attacker.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Victim's swap with slippage protection
      const slippageProtection = victimExpectedOut * 98n / 100n; // 2% slippage tolerance

      await router.connect(user).swapExactTokensForTokens(
        victimAmount,
        slippageProtection,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Verify victim still got reasonable output
      const victimBalance = await token1.balanceOf(user.address);
      expect(victimBalance).to.be.gte(slippageProtection);
    });

    it("Should prevent back-running from extracting value", async () => {
      const victimAmount = ethers.parseEther("1000");
      const attackerAmount = ethers.parseEther("100");

      await token0.mint(user.address, victimAmount);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token0.mint(attacker.address, attackerAmount);
      await token0.connect(attacker).approve(router.address, ethers.MaxUint256);

      // Victim swaps
      await router.connect(user).swapExactTokensForTokens(
        victimAmount,
        0,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Attacker tries to back-run
      const attackerBalanceBefore = await token0.balanceOf(attacker.address);

      await router.connect(attacker).swapExactTokensForTokens(
        attackerAmount,
        0,
        [token0.address, token1.address],
        attacker.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const attackerBalanceAfter = await token0.balanceOf(attacker.address);

      // Attacker should not have gained significantly
      expect(attackerBalanceAfter).to.be.lt(attackerBalanceBefore + ethers.parseEther("50"));
    });
  });

  describe("Deadline Enforcement", () => {
    it("Should enforce deadline on swap", async () => {
      const amountIn = ethers.parseEther("100");
      const expiredDeadline = Math.floor(Date.now() / 1000) - 60; // 1 minute ago

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          0,
          [token0.address, token1.address],
          user.address,
          expiredDeadline
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });

    it("Should enforce deadline on addLiquidity", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");
      const expiredDeadline = Math.floor(Date.now() / 1000) - 60;

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token1.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).addLiquidity(
          token0.address,
          token1.address,
          amount0,
          amount1,
          0,
          0,
          user.address,
          expiredDeadline
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });

    it("Should enforce deadline on removeLiquidity", async () => {
      // First add liquidity
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

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

      const lpBalance = await pair.balanceOf(user.address);
      const expiredDeadline = Math.floor(Date.now() / 1000) - 60;

      await expect(
        router.connect(user).removeLiquidity(
          token0.address,
          token1.address,
          lpBalance,
          0,
          0,
          user.address,
          expiredDeadline
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });
  });

  describe("Price Impact Protection", () => {
    it("Should calculate price impact correctly", async () => {
      const smallAmount = ethers.parseEther("1");
      const largeAmount = ethers.parseEther("5000");

      const smallAmounts = await router.getAmountsOut(smallAmount, [token0.address, token1.address]);
      const largeAmounts = await router.getAmountsOut(largeAmount, [token0.address, token1.address]);

      const smallPrice = smallAmounts[1] * ethers.parseEther("1") / smallAmount;
      const largePrice = largeAmounts[1] * ethers.parseEther("1") / largeAmount;

      // Large trade should have worse price
      expect(largePrice).to.be.lt(smallPrice);
    });

    it("Should prevent large price impact trades with slippage", async () => {
      const largeAmount = ethers.parseEther("5000");
      const amounts = await router.getAmountsOut(largeAmount, [token0.address, token1.address]);
      const expectedOut = amounts[1];

      // Set very tight slippage (0.1%)
      const tightSlippage = expectedOut * 999n / 1000n;

      await token0.mint(user.address, largeAmount);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      // This should fail due to price impact
      await expect(
        router.connect(user).swapExactTokensForTokens(
          largeAmount,
          tightSlippage,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
    });
  });

  describe("MEV Resistance", () => {
    it("Should resist arbitrage on small price differences", async () => {
      // Create another pair with slightly different price
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Mock.deploy("Token2", "T2", 18);

      await factory.createPair(token0.address, token2.address);
      const pair2Address = await factory.getPair(token0.address, token2.address);
      const pair2 = await ethers.getContractAt("DogePumpPair", pair2Address);

      // Add liquidity with different ratio
      const amount0 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("1500");

      await token0.mint(attacker.address, amount0);
      await token2.mint(attacker.address, amount2);
      await token0.connect(attacker).approve(router.address, ethers.MaxUint256);
      await token2.connect(attacker).approve(router.address, ethers.MaxUint256);

      await router.connect(attacker).addLiquidity(
        token0.address,
        token2.address,
        amount0,
        amount2,
        0,
        0,
        attacker.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Try arbitrage - should not be profitable after fees
      const arbitrageAmount = ethers.parseEther("100");
      await token0.mint(user.address, arbitrageAmount);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      const balanceBefore = await token0.balanceOf(user.address);

      // Attempt arbitrage path
      await router.connect(user).swapExactTokensForTokens(
        arbitrageAmount,
        0,
        [token0.address, token1.address, token0.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const balanceAfter = await token0.balanceOf(user.address);

      // Should not be profitable (balance should decrease due to fees)
      expect(balanceAfter).to.be.lt(balanceBefore);
    });
  });
});
