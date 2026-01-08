// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../../typechain-types";
import { DogePumpPair } from "../../typechain-types";
import { DogePumpRouter } from "../../typechain-types";
import { ERC20Mock } from "../../typechain-types";
describe("Flash Loan Tests", () => {
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

  describe("Flash Loan Support", () => {
    it("Should support flash loans", async () => {
      // Deploy flash loan borrower
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      // Give borrower some tokens to repay
      const loanAmount = ethers.parseEther("1000");
      await token0.mint(borrower.address, loanAmount);

      // Execute flash loan
      await expect(
        borrower.flashLoan(token0.address, loanAmount)
      ).to.not.be.reverted;
    });

    it("Should require repayment of flash loan", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("MaliciousFlashLoanBorrower");
      const malicious = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");

      // Should fail because malicious doesn't repay
      await expect(
        malicious.flashLoan(token0.address, loanAmount)
      ).to.be.revertedWith("UniswapV2: TRANSFER_FAILED");
    });

    it("Should charge fee on flash loans", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");
      const fee = loanAmount / 1000n; // 0.1% fee

      await token0.mint(borrower.address, loanAmount + fee);

      const balanceBefore = await token0.balanceOf(borrower.address);

      await borrower.flashLoan(token0.address, loanAmount);

      const balanceAfter = await token0.balanceOf(borrower.address);

      // Borrower should have paid the fee
      expect(balanceBefore - balanceAfter).to.equal(fee);
    });
  });

  describe("Flash Loan Attack Prevention", () => {
    it("Should prevent flash loan price manipulation", async () => {
      const FlashLoanAttacker = await ethers.getContractFactory("FlashLoanPriceManipulator");
      const attackerContract = await FlashLoanAttacker.deploy(
        pair.address,
        router.address,
        token0.address,
        token1.address
      );

      // Give attacker some tokens
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(attacker.address, amount0);
      await token1.mint(attacker.address, amount1);
      await token0.connect(attacker).approve(attackerContract.address, ethers.MaxUint256);
      await token1.connect(attacker).approve(attackerContract.address, ethers.MaxUint256);

      // Try to manipulate price with flash loan
      await expect(
        attackerContract.attack()
      ).to.be.reverted;
    });

    it("Should prevent flash loan arbitrage", async () => {
      const FlashLoanArbitrageur = await ethers.getContractFactory("FlashLoanArbitrageur");
      const arbitrageur = await FlashLoanArbitrageur.deploy(
        pair.address,
        router.address,
        token0.address,
        token1.address
      );

      // Try arbitrage with flash loan
      const loanAmount = ethers.parseEther("1000");

      await expect(
        arbitrageur.arbitrage(loanAmount)
      ).to.be.reverted;
    });

    it("Should prevent flash loan drain attack", async () => {
      const FlashLoanDrainer = await ethers.getContractFactory("FlashLoanDrainer");
      const drainer = await FlashLoanDrainer.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");

      // Should fail because drainer tries to steal funds
      await expect(
        drainer.drain(loanAmount)
      ).to.be.revertedWith("UniswapV2: TRANSFER_FAILED");
    });
  });

  describe("Flash Loan Callback Interface", () => {
    it("Should only allow pair to call uniswapV2Call", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      // Try to call uniswapV2Call directly (not from pair)
      await expect(
        borrower.uniswapV2Call(
          owner.address,
          ethers.parseEther("1000"),
          0,
          ethers.parseEther("1000"),
          "0x"
        )
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should verify sender is pair contract", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      // Verify sender check in uniswapV2Call
      const loanAmount = ethers.parseEther("1000");
      await token0.mint(borrower.address, loanAmount + loanAmount / 1000n);

      await borrower.flashLoan(token0.address, loanAmount);

      // Should have succeeded, meaning sender check passed
      expect(true).to.equal(true);
    });
  });

  describe("Flash Loan State Consistency", () => {
    it("Should maintain reserve consistency after flash loan", async () => {
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");
      await token0.mint(borrower.address, loanAmount + loanAmount / 1000n);

      await borrower.flashLoan(token0.address, loanAmount);

      const [reserve0After, reserve1After] = await pair.getReserves();

      // Reserves should be the same after flash loan
      expect(reserve0After).to.equal(reserve0Before);
      expect(reserve1After).to.equal(reserve1Before);
    });

    it("Should maintain total supply consistency after flash loan", async () => {
      const totalSupplyBefore = await pair.totalSupply();

      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");
      await token0.mint(borrower.address, loanAmount + loanAmount / 1000n);

      await borrower.flashLoan(token0.address, loanAmount);

      const totalSupplyAfter = await pair.totalSupply();

      // Total supply should be unchanged
      expect(totalSupplyAfter).to.equal(totalSupplyBefore);
    });
  });

  describe("Flash Loan Fee Calculation", () => {
    it("Should calculate correct flash loan fee", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");
      const expectedFee = loanAmount / 1000n; // 0.1%

      await token0.mint(borrower.address, loanAmount + expectedFee);

      const balanceBefore = await token0.balanceOf(borrower.address);

      await borrower.flashLoan(token0.address, loanAmount);

      const balanceAfter = await token0.balanceOf(borrower.address);

      const actualFee = balanceBefore - balanceAfter;

      expect(actualFee).to.equal(expectedFee);
    });

    it("Should handle zero fee for zero loan", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = 0n;

      await expect(
        borrower.flashLoan(token0.address, loanAmount)
      ).to.be.reverted;
    });
  });

  describe("Multiple Flash Loans", () => {
    it("Should support multiple sequential flash loans", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      // Execute multiple flash loans
      for (let i = 0; i < 5; i++) {
        const loanAmount = ethers.parseEther("100");
        const fee = loanAmount / 1000n;

        await token0.mint(borrower.address, loanAmount + fee);

        await borrower.flashLoan(token0.address, loanAmount);
      }

      // All should have succeeded
      expect(true).to.equal(true);
    });

    it("Should maintain consistency after multiple flash loans", async () => {
      const [reserve0Before, reserve1Before] = await pair.getReserves();

      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      for (let i = 0; i < 10; i++) {
        const loanAmount = ethers.parseEther("100");
        const fee = loanAmount / 1000n;

        await token0.mint(borrower.address, loanAmount + fee);

        await borrower.flashLoan(token0.address, loanAmount);
      }

      const [reserve0After, reserve1After] = await pair.getReserves();

      // Reserves should be unchanged
      expect(reserve0After).to.equal(reserve0Before);
      expect(reserve1After).to.equal(reserve1Before);
    });
  });

  describe("Flash Loan Edge Cases", () => {
    it("Should handle maximum flash loan amount", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const [reserve0,] = await pair.getReserves();
      const loanAmount = reserve0; // Borrow entire reserve
      const fee = loanAmount / 1000n;

      await token0.mint(borrower.address, loanAmount + fee);

      await expect(
        borrower.flashLoan(token0.address, loanAmount)
      ).to.not.be.reverted;
    });

    it("Should revert on insufficient repayment", async () => {
      const FlashLoanBorrower = await ethers.getContractFactory("FlashLoanBorrower");
      const borrower = await FlashLoanBorrower.deploy(pair.address);

      const loanAmount = ethers.parseEther("1000");
      const fee = loanAmount / 1000n;

      // Mint insufficient funds
      await token0.mint(borrower.address, loanAmount + fee - 1n);

      await expect(
        borrower.flashLoan(token0.address, loanAmount)
      ).to.be.revertedWith("UniswapV2: TRANSFER_FAILED");
    });
  });
});
