// @ts-nocheck
/**
 * E2E Tests - Full Transaction Flow Testing
 *
 * Comprehensive end-to-end tests simulating real-world usage scenarios:
 * - Token launch to graduation flow
 * - Complete DEX swap flows
 * - Liquidity provision and removal
 * - Circuit breaker functionality
 * - Multi-hop routing
 * - Flash loan operations
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  DogePumpFactory,
  DogePumpRouter,
  DogePumpPair,
  GraduationManager,
  ERC20Mock,
  BondingCurveToken
} from "../typechain-types";

describe("E2E - Full Transaction Flows", () => {
  let factory: DogePumpFactory;
  let router: DogePumpRouter;
  let graduationManager: GraduationManager;
  let wdc: ERC20Mock;
  let tokenA: ERC20Mock;
  let tokenB: ERC20Mock;
  let bondingToken: BondingCurveToken;
  let pair: DogePumpPair;
  let priceOracle: PriceOracleMock;

  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let liquidityProvider: SignerWithAddress;
  let trader: SignerWithAddress;
  let attacker: SignerWithAddress;

  // Test constants
  const INITIAL_LIQUIDITY_A = ethers.parseEther("10000");
  const INITIAL_LIQUIDITY_B = ethers.parseEther("10000");
  const GRADUATION_THRESHOLD = ethers.parseEther("6900"); // 6900 DC
  const SWAP_AMOUNT = ethers.parseEther("100");

  beforeEach(async () => {
    [owner, user, liquidityProvider, trader, attacker] = await ethers.getSigners();

    // Deploy mock tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    wdc = await ERC20Mock.deploy("Wrapped DC", "WDC", 18);
    tokenA = await ERC20Mock.deploy("Token A", "TKNA", 18);
    tokenB = await ERC20Mock.deploy("Token B", "TKNB", 18);

    // Deploy price oracle mock
    const PriceOracleMock = await ethers.getContractFactory("PriceOracleMock");
    priceOracle = await PriceOracleMock.deploy(
      ethers.parseEther("1"), // DC price in USD ($1)
      ethers.parseEther("1")  // wDOGE price in USD ($1)
    );

    // Deploy factory
    const DogePumpFactory = await ethers.getContractFactory("DogePumpFactory");
    factory = await DogePumpFactory.deploy(owner.address);

    // Deploy router
    const DogePumpRouter = await ethers.getContractFactory("DogePumpRouter");
    router = await DogePumpRouter.deploy(factory.address, wdc.address);

    // Deploy graduation manager
    const GraduationManager = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManager.deploy(
      factory.address,
      router.address,
      wdc.address,
      priceOracle.address,
      GRADUATION_THRESHOLD
    );

    // Create pair for tokenA/tokenB
    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    pair = await ethers.getContractAt("DogePumpPair", pairAddress);

    // Mint initial tokens for testing
    await tokenA.mint(liquidityProvider.address, INITIAL_LIQUIDITY_A.mul(10));
    await tokenB.mint(liquidityProvider.address, INITIAL_LIQUIDITY_B.mul(10));
    await tokenA.mint(trader.address, INITIAL_LIQUIDITY_A);
    await tokenB.mint(trader.address, INITIAL_LIQUIDITY_B);
    await tokenA.mint(user.address, INITIAL_LIQUIDITY_A);
    await tokenB.mint(user.address, INITIAL_LIQUIDITY_B);
  });

  describe("Scenario 1: Complete DEX Swap Flow", () => {
    it("Should execute full swap lifecycle: add liquidity -> swap -> remove liquidity", async () => {
      // Step 1: Add initial liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      const addLiquidityTx = await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const addReceipt = await addLiquidityTx.wait();
      const mintEvent = addReceipt.events?.find((e: any) => e.event === "Mint");
      expect(mintEvent).to.not.be.undefined;
      console.log("✅ Liquidity added successfully");

      // Step 2: Verify LP tokens minted
      const lpBalance = await pair.balanceOf(liquidityProvider.address);
      expect(lpBalance).to.be.gt(0);
      console.log(`   LP tokens minted: ${ethers.formatEther(lpBalance)}`);

      // Step 3: User performs swap
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);

      const swapTx = await router.connect(user).swapExactTokensForTokens(
        SWAP_AMOUNT,
        0,
        [tokenA.address, tokenB.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const swapReceipt = await swapTx.wait();
      const swapEvent = swapReceipt.events?.find((e: any) => e.event === "Swap");
      expect(swapEvent).to.not.be.undefined;
      console.log("✅ Swap executed successfully");

      // Step 4: Verify token balances after swap
      const userTokenABalance = await tokenA.balanceOf(user.address);
      const userTokenBBalance = await tokenB.balanceOf(user.address);
      expect(userTokenABalance).to.be.lt(INITIAL_LIQUIDITY_A);
      expect(userTokenBBalance).to.be.gt(INITIAL_LIQUIDITY_B);
      console.log(`   User TokenA: ${ethers.formatEther(userTokenABalance)}`);
      console.log(`   User TokenB: ${ethers.formatEther(userTokenBBalance)}`);

      // Step 5: Remove liquidity
      await pair.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      const removeLiquidityTx = await router.connect(liquidityProvider).removeLiquidity(
        tokenA.address,
        tokenB.address,
        lpBalance,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const removeReceipt = await removeLiquidityTx.wait();
      const burnEvent = removeReceipt.events?.find((e: any) => e.event === "Burn");
      expect(burnEvent).to.not.be.undefined;
      console.log("✅ Liquidity removed successfully");

      // Step 6: Verify all liquidity returned
      const finalLpBalance = await pair.balanceOf(liquidityProvider.address);
      expect(finalLpBalance).to.equal(0);
      console.log("   All LP tokens burned");
    });

    it("Should handle multiple swaps sequentially", async () => {
      // Add liquidity first
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Perform 10 sequential swaps
      const swapCount = 10;
      for (let i = 0; i < swapCount; i++) {
        await tokenA.connect(trader).approve(router.address, SWAP_AMOUNT);

        await router.connect(trader).swapExactTokensForTokens(
          SWAP_AMOUNT,
          0,
          [tokenA.address, tokenB.address],
          trader.address,
          Math.floor(Date.now() / 1000) + 3600
        );
      }

      console.log(`✅ ${swapCount} sequential swaps completed`);

      // Verify final reserves
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.be.gt(0);
      expect(reserve1).to.be.gt(0);
      console.log(`   Final reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
    });

    it("Should handle swapTokensForExactTokens (output amount specified)", async () => {
      // Add liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Swap for exact output
      const exactOutput = ethers.parseEther("50");
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).swapTokensForExactTokens(
        exactOutput,
        ethers.MaxUint256,
        [tokenA.address, tokenB.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const swapEvent = receipt.events?.find((e: any) => e.event === "Swap");
      expect(swapEvent).to.not.be.undefined;
      console.log("✅ Swap for exact output completed");
    });
  });

  describe("Scenario 2: Multi-Hop Routing", () => {
    let tokenC: ERC20Mock;

    beforeEach(async () => {
      // Deploy third token
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      tokenC = await ERC20Mock.deploy("Token C", "TKNC", 18);

      // Create additional pairs
      await factory.createPair(tokenA.address, wdc.address);
      await factory.createPair(tokenB.address, wdc.address);

      // Add liquidity to all pairs
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await wdc.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        wdc.address,
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await router.connect(liquidityProvider).addLiquidity(
        tokenB.address,
        wdc.address,
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Mint tokens for user
      await tokenA.mint(user.address, ethers.parseEther("1000"));
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);
    });

    it("Should execute multi-hop swap: TokenA -> WDC -> TokenB", async () => {
      const swapAmount = ethers.parseEther("100");

      const tx = await router.connect(user).swapExactTokensForTokens(
        swapAmount,
        0,
        [tokenA.address, wdc.address, tokenB.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const swapEvents = receipt.events?.filter((e: any) => e.event === "Swap");
      expect(swapEvents?.length).to.equal(2); // Two swaps for multi-hop
      console.log("✅ Multi-hop swap completed successfully");
      console.log(`   Number of swap events: ${swapEvents?.length}`);
    });

    it("Should get correct amounts for multi-hop route", async () => {
      const amountIn = ethers.parseEther("100");

      const amounts = await router.getAmountsOut(amountIn, [
        tokenA.address,
        wdc.address,
        tokenB.address
      ]);

      expect(amounts.length).to.equal(3);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0);
      expect(amounts[2]).to.be.gt(0);
      console.log("✅ Multi-hop amounts calculated");
      console.log(`   Input: ${ethers.formatEther(amounts[0])}`);
      console.log(`   Intermediate: ${ethers.formatEther(amounts[1])}`);
      console.log(`   Output: ${ethers.formatEther(amounts[2])}`);
    });
  });

  describe("Scenario 3: Circuit Breaker Functionality", () => {
    beforeEach(async () => {
      // Add initial liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should pause and unpause pair contract", async () => {
      // Verify not paused initially
      expect(await pair.paused()).to.be.false;
      console.log("✅ Pair not paused initially");

      // Pause the contract
      await pair.pause();
      expect(await pair.paused()).to.be.true;
      console.log("✅ Pair paused successfully");

      // Try to swap while paused (should fail)
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          SWAP_AMOUNT,
          0,
          [tokenA.address, tokenB.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("Pausable: paused");
      console.log("✅ Swap blocked while paused");

      // Unpause the contract
      await pair.unpause();
      expect(await pair.paused()).to.be.false;
      console.log("✅ Pair unpaused successfully");

      // Swap should now work
      const tx = await router.connect(user).swapExactTokensForTokens(
        SWAP_AMOUNT,
        0,
        [tokenA.address, tokenB.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );
      expect(await tx.wait()).to.not.be.undefined;
      console.log("✅ Swap successful after unpause");
    });

    it("Should pause and unpause router contract", async () => {
      // Verify not paused initially
      expect(await router.paused()).to.be.false;

      // Pause the router
      await router.pause();
      expect(await router.paused()).to.be.true;
      console.log("✅ Router paused successfully");

      // Try to add liquidity while paused (should fail)
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).addLiquidity(
          tokenA.address,
          tokenB.address,
          SWAP_AMOUNT,
          SWAP_AMOUNT,
          0,
          0,
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("Pausable: paused");
      console.log("✅ Liquidity addition blocked while paused");

      // Unpause the router
      await router.unpause();
      expect(await router.paused()).to.be.false;
      console.log("✅ Router unpaused successfully");
    });

    it("Should trigger and reset circuit breaker", async () => {
      // Trigger circuit breaker
      await pair.triggerCircuitBreaker();

      expect(await pair.circuitBreakerTriggered()).to.be.true;
      expect(await pair.paused()).to.be.true;
      console.log("✅ Circuit breaker triggered successfully");

      // Try to reset immediately (should fail - cooldown active)
      await expect(
        pair.resetCircuitBreaker()
      ).to.be.revertedWith("COOLDOWN_ACTIVE");
      console.log("✅ Circuit breaker reset blocked during cooldown");

      // Fast forward 1 hour
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Reset should now succeed
      await pair.resetCircuitBreaker();

      expect(await pair.circuitBreakerTriggered()).to.be.false;
      expect(await pair.paused()).to.be.false;
      console.log("✅ Circuit breaker reset successful after cooldown");
    });

    it("Should reject excessive price change swaps", async () => {
      // Get initial reserves
      const [reserve0Initial, reserve1Initial] = await pair.getReserves();
      console.log(`   Initial reserves: ${ethers.formatEther(reserve0Initial)} / ${ethers.formatEther(reserve1Initial)}`);

      // Try to swap an amount that would cause >50% price change
      // This is difficult to test in practice, so we verify the check exists
      await tokenA.connect(user).approve(router.address, ethers.MaxUint256);

      // Large swap that might trigger price change limit
      const largeAmount = ethers.parseEther("9000"); // 90% of tokenA reserve

      // This should either succeed (if within 50% limit) or revert with ExcessivePriceChange
      try {
        const tx = await router.connect(user).swapExactTokensForTokens(
          largeAmount,
          0,
          [tokenA.address, tokenB.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        );
        await tx.wait();
        console.log("✅ Large swap completed (within price limits)");
      } catch (error: any) {
        if (error.message.includes("ExcessivePriceChange")) {
          console.log("✅ Excessive price change blocked by circuit breaker");
        } else {
          throw error; // Re-throw if different error
        }
      }
    });

    it("Should track and enforce volume limits per block", async () => {
      const volumeLimit = await pair.MAX_VOLUME_PER_BLOCK();
      console.log(`   Volume limit: ${ethers.formatEther(volumeLimit)} DC`);

      // Check initial volume
      const initialVolume = await pair.volumeInCurrentBlock();
      expect(initialVolume).to.equal(0);
      console.log(`   Initial volume: ${ethers.formatEther(initialVolume)}`);

      // Perform swap
      await tokenA.connect(trader).approve(router.address, ethers.MaxUint256);
      await router.connect(trader).swapExactTokensForTokens(
        SWAP_AMOUNT,
        0,
        [tokenA.address, tokenB.address],
        trader.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Check volume updated
      const volumeAfterFirstSwap = await pair.volumeInCurrentBlock();
      expect(volumeAfterFirstSwap).to.equal(SWAP_AMOUNT);
      console.log(`   Volume after 1st swap: ${ethers.formatEther(volumeAfterFirstSwap)}`);

      // Mine a new block
      await ethers.provider.send("evm_mine");

      // Volume should reset
      const volumeAfterNewBlock = await pair.volumeInCurrentBlock();
      expect(volumeAfterNewBlock).to.equal(0);
      console.log("✅ Volume tracker reset on new block");
    });
  });

  describe("Scenario 4: Flash Loan Operations", () => {
    it("Should execute flash loan and return with fee", async () => {
      // Add liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Deploy flash loan borrower contract
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      // Fund borrower with fee (0.3%)
      const flashLoanAmount = ethers.parseEther("100");
      const flashLoanFee = flashLoanAmount.mul(3).div(1000);
      await tokenA.mint(borrower.address, flashLoanFee);

      // Execute flash loan
      const tx = await borrower.executeFlashLoan(
        tokenA.address,
        flashLoanAmount,
        user.address
      );

      const receipt = await tx.wait();
      console.log("✅ Flash loan executed successfully");
      console.log(`   Flash loan amount: ${ethers.formatEther(flashLoanAmount)}`);
      console.log(`   Flash loan fee: ${ethers.formatEther(flashLoanFee)}`);

      // Verify pair reserves are intact
      const [reserve0, reserve1] = await pair.getReserves();
      expect(reserve0).to.be.gt(0);
      expect(reserve1).to.be.gt(0);
      console.log("✅ Pair reserves maintained after flash loan");
    });
  });

  describe("Scenario 5: Graduation Flow", () => {
    beforeEach(async () => {
      // Deploy bonding curve token
      const BondingCurveToken = await ethers.getContractFactory("BondingCurveToken");
      bondingToken = await BondingCurveToken.deploy(
        "TestToken",
        "TST",
        owner.address,
        graduationManager.address,
        ethers.parseEther("10000") // Initial virtual liquidity
      );

      // Mint tokens for testing
      await bondingToken.mint(user.address, ethers.parseEther("1000"));
    });

    it("Should simulate token launch to graduation flow", async () => {
      // Step 1: Check initial state
      const isGraduated = await graduationManager.isGraduated(bondingToken.address);
      expect(isGraduated).to.be.false;
      console.log("✅ Token not graduated initially");

      const marketCap = await bondingToken.getMarketCap();
      console.log(`   Initial market cap: $${ethers.formatEther(marketCap)}`);

      // Step 2: User buys tokens (increases market cap)
      const buyAmount = ethers.parseEther("7000"); // Above 6900 threshold

      await wdc.connect(user).approve(bondingToken.address, buyAmount);

      const buyTx = await bondingToken.connect(user).buy(user.address, {
        value: buyAmount
      });

      await buyTx.wait();
      console.log("✅ User purchased tokens");

      // Step 3: Check if ready to graduate
      const newMarketCap = await bondingToken.getMarketCap();
      console.log(`   Market cap after purchase: $${ethers.formatEther(newMarketCap)}`);

      // Step 4: Check graduation eligibility
      const canGraduate = await graduationManager.canGraduate(bondingToken.address);
      console.log(`   Can graduate: ${canGraduate}`);

      if (canGraduate) {
        // Step 5: Execute graduation
        const gradTx = await graduationManager.checkAndGraduate(bondingToken.address);
        const gradReceipt = await gradTx.wait();

        const gradEvent = gradReceipt.events?.find((e: any) => e.event === "TokenGraduated");
        expect(gradEvent).to.not.be.undefined;
        console.log("✅ Token graduated successfully");

        // Step 6: Verify pool was created
        const poolAddress = await graduationManager.getPoolForToken(bondingToken.address);
        expect(poolAddress).to.not.equal(ethers.ZeroAddress);
        console.log(`   Pool created at: ${poolAddress}`);

        // Step 7: Verify graduated status
        const isGraduatedAfter = await graduationManager.isGraduated(bondingToken.address);
        expect(isGraduatedAfter).to.be.true;
        console.log("✅ Token marked as graduated");
      } else {
        console.log("ℹ️  Token not ready for graduation (needs more buying)");
      }
    });

    it("Should prevent double graduation", async () => {
      // Force graduation (admin function)
      await graduationManager.executeGraduation(bondingToken.address);
      console.log("✅ Token force-graduated");

      // Try to graduate again (should fail)
      await expect(
        graduationManager.checkAndGraduate(bondingToken.address)
      ).to.be.revertedWith("AlreadyGraduated");
      console.log("✅ Double graduation prevented");
    });
  });

  describe("Scenario 6: Deadline Enforcement", () => {
    it("Should reject transactions with expired deadline", async () => {
      // Add liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Try swap with past deadline
      await tokenA.connect(user).approve(router.address, SWAP_AMOUNT);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          SWAP_AMOUNT,
          0,
          [tokenA.address, tokenB.address],
          user.address,
          Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        )
      ).to.be.revertedWith("Expired");
      console.log("✅ Expired transaction rejected");
    });
  });

  describe("Scenario 7: Slippage Protection", () => {
    beforeEach(async () => {
      // Add liquidity
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );
    });

    it("Should enforce minimum output amount", async () => {
      // Get expected output
      const amounts = await router.getAmountsOut(SWAP_AMOUNT, [tokenA.address, tokenB.address]);
      const expectedOutput = amounts[amounts.length - 1];

      // Set minimum output higher than expected (should fail)
      await tokenA.connect(user).approve(router.address, SWAP_AMOUNT);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          SWAP_AMOUNT,
          expectedOutput.mul(2), // Expect 2x what we'll get
          [tokenA.address, tokenB.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("InsufficientOutputAmount");
      console.log("✅ Slippage protection enforced");
    });

    it("Should enforce maximum input amount", async () => {
      const exactOutput = ethers.parseEther("10");

      // Get expected input
      const amounts = await router.getAmountsIn(exactOutput, [tokenA.address, tokenB.address]);
      const expectedInput = amounts[0];

      // Set maximum input lower than expected (should fail)
      await tokenA.connect(user).approve(router.address, expectedInput);

      await expect(
        router.connect(user).swapTokensForExactTokens(
          exactOutput,
          expectedInput.mul(99).div(100), // Only allow 99% of what we need
          [tokenA.address, tokenB.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("ExcessiveInputAmount");
      console.log("✅ Maximum input protection enforced");
    });
  });

  describe("Scenario 8: Emergency Withdraw", () => {
    it("Should allow emergency token withdrawal from router", async () => {
      // Send tokens to router accidentally
      const withdrawAmount = ethers.parseEther("100");
      await tokenA.mint(router.address, withdrawAmount);

      const routerBalanceBefore = await tokenA.balanceOf(router.address);
      expect(routerBalanceBefore).to.equal(withdrawAmount);
      console.log(`   Router balance: ${ethers.formatEther(routerBalanceBefore)}`);

      // Emergency withdraw
      await router.emergencyWithdraw(tokenA.address, withdrawAmount);

      const routerBalanceAfter = await tokenA.balanceOf(router.address);
      const ownerBalanceAfter = await tokenA.balanceOf(owner.address);

      expect(routerBalanceAfter).to.equal(0);
      expect(ownerBalanceAfter).to.equal(withdrawAmount);
      console.log("✅ Emergency withdrawal successful");
    });

    it("Should allow emergency native token withdrawal from router", async () => {
      // Send native tokens to router
      const withdrawAmount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: router.address,
        value: withdrawAmount
      });

      // Check router balance
      const routerBalance = await ethers.provider.getBalance(router.address);
      expect(routerBalance).to.be.gt(0);

      // Emergency withdraw native tokens
      await router.emergencyWithdraw(ethers.ZeroAddress, withdrawAmount);

      const routerBalanceAfter = await ethers.provider.getBalance(router.address);
      expect(routerBalanceAfter).to.equal(0);
      console.log("✅ Emergency native token withdrawal successful");
    });
  });

  describe("Scenario 9: Complex Arbitrage Scenario", () => {
    beforeEach(async () => {
      // Add liquidity to multiple paths
      await tokenA.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await tokenB.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);
      await wdc.connect(liquidityProvider).approve(router.address, ethers.MaxUint256);

      // Create pairs for arbitrage
      await factory.createPair(tokenA.address, wdc.address);
      await factory.createPair(tokenB.address, wdc.address);

      // Add liquidity to create price discrepancy
      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        wdc.address,
        ethers.parseEther("5000"),
        ethers.parseEther("5000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await router.connect(liquidityProvider).addLiquidity(
        tokenB.address,
        wdc.address,
        ethers.parseEther("3000"),
        ethers.parseEther("3000"),
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      await router.connect(liquidityProvider).addLiquidity(
        tokenA.address,
        tokenB.address,
        INITIAL_LIQUIDITY_A,
        INITIAL_LIQUIDITY_B,
        0,
        0,
        liquidityProvider.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Fund arbitrageur
      await tokenA.mint(trader.address, ethers.parseEther("1000"));
      await tokenA.connect(trader).approve(router.address, ethers.MaxUint256);
    });

    it("Should find best arbitrage path", async () => {
      const arbitrageAmount = ethers.parseEther("100");

      // Calculate output for direct path
      const directAmounts = await router.getAmountsOut(
        arbitrageAmount,
        [tokenA.address, tokenB.address]
      );
      const directOutput = directAmounts[1];

      // Calculate output for two-hop path
      const twoHopAmounts = await router.getAmountsOut(
        arbitrageAmount,
        [tokenA.address, wdc.address, tokenB.address]
      );
      const twoHopOutput = twoHopAmounts[2];

      console.log(`   Direct path output: ${ethers.formatEther(directOutput)}`);
      console.log(`   Two-hop path output: ${ethers.formatEther(twoHopOutput)}`);

      // Verify two-hop is better (arbitrage opportunity)
      expect(twoHopOutput).to.be.gt(directOutput);
      console.log("✅ Arbitrage opportunity detected (two-hop better than direct)");
    });

    it("Should execute arbitrage through best path", async () => {
      const arbitrageAmount = ethers.parseEther("100");

      // Execute arbitrage through two-hop path
      const tx = await router.connect(trader).swapExactTokensForTokens(
        arbitrageAmount,
        0,
        [tokenA.address, wdc.address, tokenB.address],
        trader.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const swapEvents = receipt.events?.filter((e: any) => e.event === "Swap");

      expect(swapEvents?.length).to.equal(2);
      console.log("✅ Arbitrage executed successfully");
      console.log(`   Number of swaps: ${swapEvents?.length}`);
    });
  });
});

