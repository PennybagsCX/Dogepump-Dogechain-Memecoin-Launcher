// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpRouter } from "../typechain-types";
import { DogePumpFactory } from "../typechain-types";
import { DogePumpPair } from "../typechain-types";
import { ERC20Mock } from "../typechain-types";
describe("DogePumpRouter", () => {
  let router: DogePumpRouter;
  let factory: DogePumpFactory;
  let weth: ERC20Mock;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let pair: DogePumpPair;
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

  describe("Deployment", () => {
    it("Should set correct factory", async () => {
      expect(await router.factory()).to.equal(factory.address);
    });

    it("Should set correct WETH", async () => {
      expect(await router.WETH()).to.equal(weth.address);
    });
  });

  describe("addLiquidity", () => {
    it("Should add liquidity with optimal amounts", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token1.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        amount0 * 99n / 100n,
        amount1 * 99n / 100n,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "Mint");

      expect(event).to.not.be.undefined;
    });

    it("Should add liquidity with unequal amounts", async () => {
      const amount0 = ethers.parseEther("150");
      const amount1 = ethers.parseEther("200");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);
      await token1.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).addLiquidity(
        token0.address,
        token1.address,
        amount0,
        amount1,
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should revert with insufficient liquidity", async () => {
      const amount0 = ethers.parseEther("0.0001");
      const amount1 = ethers.parseEther("0.0001");

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
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.reverted;
    });

    it("Should revert with insufficient amount A", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

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
          amount0 * 2n,
          amount1 * 99n / 100n,
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("insufficient A amount");
    });

    it("Should revert with insufficient amount B", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

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
          amount0 * 99n / 100n,
          amount1 * 2n,
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("insufficient B amount");
    });

    it("Should revert with expired deadline", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

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
          Math.floor(Date.now() / 1000) - 3600
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });
  });

  describe("removeLiquidity", () => {
    beforeEach(async () => {
      // Add liquidity for user
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
    });

    it("Should remove liquidity", async () => {
      const lpBalance = await pair.balanceOf(user.address);
      const liquidity = lpBalance / 2n;

      const tx = await router.connect(user).removeLiquidity(
        token0.address,
        token1.address,
        liquidity,
        0,
        0,
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "Burn");

      expect(event).to.not.be.undefined;
    });

    it("Should revert with insufficient liquidity", async () => {
      const liquidity = ethers.parseEther("1000000");

      await expect(
        router.connect(user).removeLiquidity(
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.reverted;
    });

    it("Should revert with expired deadline", async () => {
      const lpBalance = await pair.balanceOf(user.address);
      const liquidity = lpBalance / 2n;

      await expect(
        router.connect(user).removeLiquidity(
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          user.address,
          Math.floor(Date.now() / 1000) - 3600
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });
  });

  describe("swapExactTokensForTokens", () => {
    it("Should swap exact tokens for tokens (direct)", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutMin = ethers.parseEther("18");

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "Swap");

      expect(event).to.not.be.undefined;
    });

    it("Should swap exact tokens for tokens (multi-hop)", async () => {
      // Create token2 and pair with token1
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Mock.deploy("Token2", "T2", 18);

      await factory.createPair(token1.address, token2.address);
      const pair2Address = await factory.getPair(token1.address, token2.address);
      const pair2 = await ethers.getContractAt("DogePumpPair", pair2Address);

      // Add liquidity to second pair
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("1000");

      await token1.mint(owner.address, amount1);
      await token2.mint(owner.address, amount2);
      await token1.approve(router.address, ethers.MaxUint256);
      await token2.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        token1.address,
        token2.address,
        amount1,
        amount2,
        amount1,
        amount2,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      // Multi-hop swap
      const amountIn = ethers.parseEther("10");
      const amountOutMin = ethers.parseEther("8");

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [token0.address, token1.address, token2.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should revert with insufficient output amount", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutMin = ethers.parseEther("1000");

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

    it("Should revert with expired deadline", async () => {
      const amountIn = ethers.parseEther("10");
      const amountOutMin = ethers.parseEther("18");

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) - 3600
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });
  });

  describe("swapTokensForExactTokens", () => {
    it("Should swap tokens for exact tokens (direct)", async () => {
      const amountOut = ethers.parseEther("18");
      const amountInMax = ethers.parseEther("12");

      await token0.mint(user.address, amountInMax);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      const tx = await router.connect(user).swapTokensForExactTokens(
        amountOut,
        amountInMax,
        [token0.address, token1.address],
        user.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === "Swap");

      expect(event).to.not.be.undefined;
    });

    it("Should revert with excessive input amount", async () => {
      const amountOut = ethers.parseEther("18");
      const amountInMax = ethers.parseEther("1");

      await token0.mint(user.address, amountInMax);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapTokensForExactTokens(
          amountOut,
          amountInMax,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.be.revertedWith("UniswapV2Router: EXCESSIVE_INPUT_AMOUNT");
    });

    it("Should revert with expired deadline", async () => {
      const amountOut = ethers.parseEther("18");
      const amountInMax = ethers.parseEther("12");

      await token0.mint(user.address, amountInMax);
      await token0.connect(user).approve(router.address, ethers.MaxUint256);

      await expect(
        router.connect(user).swapTokensForExactTokens(
          amountOut,
          amountInMax,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) - 3600
        )
      ).to.be.revertedWith("UniswapV2Router: EXPIRED");
    });
  });

  describe("getAmountsOut", () => {
    it("Should calculate correct output amounts", async () => {
      const amountIn = ethers.parseEther("10");
      const amounts = await router.getAmountsOut(amountIn, [token0.address, token1.address]);

      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0);
    });

    it("Should calculate correct output amounts for multi-hop", async () => {
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Mock.deploy("Token2", "T2", 18);

      await factory.createPair(token1.address, token2.address);
      const pair2Address = await factory.getPair(token1.address, token2.address);
      const pair2 = await ethers.getContractAt("DogePumpPair", pair2Address);

      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("1000");

      await token1.mint(owner.address, amount1);
      await token2.mint(owner.address, amount2);
      await token1.approve(router.address, ethers.MaxUint256);
      await token2.approve(router.address, ethers.MaxUint256);

      await router.addLiquidity(
        token1.address,
        token2.address,
        amount1,
        amount2,
        amount1,
        amount2,
        owner.address,
        Math.floor(Date.now() / 1000) + 3600
      );

      const amountIn = ethers.parseEther("10");
      const amounts = await router.getAmountsOut(amountIn, [token0.address, token1.address, token2.address]);

      expect(amounts.length).to.equal(3);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0);
      expect(amounts[2]).to.be.gt(0);
    });

    it("Should revert for invalid path", async () => {
      const amountIn = ethers.parseEther("10");
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Mock.deploy("Token2", "T2", 18);

      await expect(
        router.getAmountsOut(amountIn, [token0.address, token2.address])
      ).to.be.reverted;
    });
  });

  describe("getAmountsIn", () => {
    it("Should calculate correct input amounts", async () => {
      const amountOut = ethers.parseEther("18");
      const amounts = await router.getAmountsIn(amountOut, [token0.address, token1.address]);

      expect(amounts.length).to.equal(2);
      expect(amounts[1]).to.equal(amountOut);
      expect(amounts[0]).to.be.gt(0);
    });

    it("Should revert for invalid path", async () => {
      const amountOut = ethers.parseEther("18");
      const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
      const token2 = await ERC20Mock.deploy("Token2", "T2", 18);

      await expect(
        router.getAmountsIn(amountOut, [token0.address, token2.address])
      ).to.be.reverted;
    });
  });

  describe("quote", () => {
    it("Should calculate correct quote", async () => {
      const amountA = ethers.parseEther("100");
      const reserveA = ethers.parseEther("1000");
      const reserveB = ethers.parseEther("2000");

      const amountB = await router.quote(amountA, reserveA, reserveB);

      expect(amountB).to.equal(ethers.parseEther("200"));
    });

    it("Should revert with zero reserve", async () => {
      const amountA = ethers.parseEther("100");
      const reserveA = ethers.parseEther("1000");
      const reserveB = BigInt(0);

      await expect(
        router.quote(amountA, reserveA, reserveB)
      ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    });
  });

  describe("getAmountOut", () => {
    it("Should calculate correct amount out with fee", async () => {
      const amountIn = ethers.parseEther("100");
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = ethers.parseEther("2000");

      const amountOut = await router.getAmountOut(amountIn, reserveIn, reserveOut);

      // Expected: 100 * 997 / 1000 * 2000 / (1000 + 100 * 997 / 1000)
      // = 99.7 * 2000 / 1099.7 ≈ 181.35
      expect(amountOut).to.be.gt(ethers.parseEther("180"));
      expect(amountOut).to.be.lt(ethers.parseEther("182"));
    });

    it("Should revert with insufficient liquidity", async () => {
      const amountIn = ethers.parseEther("100");
      const reserveIn = BigInt(0);
      const reserveOut = ethers.parseEther("2000");

      await expect(
        router.getAmountOut(amountIn, reserveIn, reserveOut)
      ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    });

    it("Should revert with insufficient liquidity for output", async () => {
      const amountIn = ethers.parseEther("100");
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = BigInt(0);

      await expect(
        router.getAmountOut(amountIn, reserveIn, reserveOut)
      ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    });
  });

  describe("getAmountIn", () => {
    it("Should calculate correct amount in with fee", async () => {
      const amountOut = ethers.parseEther("180");
      const reserveIn = ethers.parseEther("1000");
      const reserveOut = ethers.parseEther("2000");

      const amountIn = await router.getAmountIn(amountOut, reserveIn, reserveOut);

      expect(amountIn).to.be.gt(ethers.parseEther("90"));
      expect(amountIn).to.be.lt(ethers.parseEther("110"));
    });

    it("Should revert with insufficient liquidity", async () => {
      const amountOut = ethers.parseEther("180");
      const reserveIn = BigInt(0);
      const reserveOut = ethers.parseEther("2000");

      await expect(
        router.getAmountIn(amountOut, reserveIn, reserveOut)
      ).to.be.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    });
  });
});
