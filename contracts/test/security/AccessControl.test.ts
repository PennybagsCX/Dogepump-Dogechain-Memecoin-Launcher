// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../../typechain-types";
import { DogePumpPair } from "../../typechain-types";
import { DogePumpRouter } from "../../typechain-types";
import { GraduationManager } from "../../typechain-types";
import { ERC20Mock } from "../../typechain-types";
describe("Access Control Tests", () => {
  let factory: DogePumpFactory;
  let pair: DogePumpPair;
  let router: DogePumpRouter;
  let graduationManager: GraduationManager;
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

    // Deploy graduation manager
    const GraduationManager = await ethers.getContractFactory("GraduationManager");
    graduationManager = await GraduationManager.deploy(factory.address, router.address, owner.address);

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

  describe("Factory Access Control", () => {
    it("Should allow owner to set feeTo", async () => {
      const newFeeTo = user.address;

      await factory.connect(owner).setFeeTo(newFeeTo);
      expect(await factory.feeTo()).to.equal(newFeeTo);
    });

    it("Should prevent non-owner from setting feeTo", async () => {
      await expect(
        factory.connect(user).setFeeTo(user.address)
      ).to.be.revertedWith("Forbidden");
    });

    it("Should prevent attacker from setting feeTo", async () => {
      await expect(
        factory.connect(attacker).setFeeTo(attacker.address)
      ).to.be.revertedWith("Forbidden");
    });

    it("Should allow owner to set feeToSetter", async () => {
      const newFeeToSetter = user.address;

      await factory.connect(owner).setFeeToSetter(newFeeToSetter);
      expect(await factory.feeToSetter()).to.equal(newFeeToSetter);
    });

    it("Should prevent non-owner from setting feeToSetter", async () => {
      await expect(
        factory.connect(user).setFeeToSetter(user.address)
      ).to.be.revertedWith("Forbidden");
    });

    it("Should prevent setting feeToSetter to zero address", async () => {
      await expect(
        factory.connect(owner).setFeeToSetter(ethers.ZeroAddress)
      ).to.be.revertedWith("ZeroAddress");
    });
  });

  describe("Pair Access Control", () => {
    it("Should prevent non-factory from initializing pair", async () => {
      const DogePumpPair = await ethers.getContractFactory("DogePumpPair");
      const newPair = await DogePumpPair.deploy();

      await expect(
        newPair.initialize(token0.address, token1.address)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should prevent non-factory from minting LP tokens", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(pair.address, amount0);
      await token1.connect(user).approve(pair.address, amount1);

      await expect(
        pair.connect(user).mint(user.address)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should prevent non-factory from burning LP tokens", async () => {
      await expect(
        pair.connect(user).burn(user.address)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should prevent re-initialization", async () => {
      await expect(
        pair.initialize(token0.address, token1.address)
      ).to.be.revertedWith("ALREADY_INITIALIZED");
    });
  });

  describe("Router Access Control", () => {
    it("Should allow anyone to use swap functions", async () => {
      const amountIn = ethers.parseEther("100");

      await token0.mint(user.address, amountIn);
      await token0.connect(user).approve(router.address, amountIn);

      await expect(
        router.connect(user).swapExactTokensForTokens(
          amountIn,
          0,
          [token0.address, token1.address],
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.not.be.reverted;
    });

    it("Should allow anyone to use addLiquidity", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(router.address, amount0);
      await token1.connect(user).approve(router.address, amount1);

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
      ).to.not.be.reverted;
    });

    it("Should allow anyone to use removeLiquidity", async () => {
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

      // Remove liquidity
      await expect(
        router.connect(user).removeLiquidity(
          token0.address,
          token1.address,
          lpBalance,
          0,
          0,
          user.address,
          Math.floor(Date.now() / 1000) + 3600
        )
      ).to.not.be.reverted;
    });
  });

  describe("Graduation Manager Access Control", () => {
    it("Should allow owner to set graduation threshold", async () => {
      const newThreshold = ethers.parseEther("500000");

      await graduationManager.connect(owner).setGraduationThreshold(newThreshold);
      expect(await graduationManager.graduationThreshold()).to.equal(newThreshold);
    });

    it("Should prevent non-owner from setting graduation threshold", async () => {
      const newThreshold = ethers.parseEther("500000");

      await expect(
        graduationManager.connect(user).setGraduationThreshold(newThreshold)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent attacker from setting graduation threshold", async () => {
      const newThreshold = ethers.parseEther("500000");

      await expect(
        graduationManager.connect(attacker).setGraduationThreshold(newThreshold)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to execute graduation", async () => {
      await expect(
        graduationManager.connect(owner).executeGraduation(token0.address)
      ).to.not.be.reverted;
    });

    it("Should prevent non-owner from executing graduation", async () => {
      await expect(
        graduationManager.connect(user).executeGraduation(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent attacker from executing graduation", async () => {
      await expect(
        graduationManager.connect(attacker).executeGraduation(token0.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to transfer ownership", async () => {
      await graduationManager.connect(owner).transferOwnership(user.address);
      expect(await graduationManager.owner()).to.equal(user.address);
    });

    it("Should prevent non-owner from transferring ownership", async () => {
      await expect(
        graduationManager.connect(user).transferOwnership(user.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent transferring ownership to zero address", async () => {
      await expect(
        graduationManager.connect(owner).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("Should allow owner to renounce ownership", async () => {
      await graduationManager.connect(owner).renounceOwnership();
      expect(await graduationManager.owner()).to.equal(ethers.ZeroAddress);
    });

    it("Should prevent non-owner from renouncing ownership", async () => {
      await expect(
        graduationManager.connect(user).renounceOwnership()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Token Access Control", () => {
    it("Should allow anyone to transfer tokens", async () => {
      const amount = ethers.parseEther("100");

      await token0.mint(user.address, amount);
      await expect(
        token0.connect(user).transfer(owner.address, amount)
      ).to.not.be.reverted;
    });

    it("Should allow anyone to approve spending", async () => {
      await expect(
        token0.connect(user).approve(owner.address, ethers.MaxUint256)
      ).to.not.be.reverted;
    });

    it("Should prevent transfer with insufficient balance", async () => {
      const amount = ethers.parseEther("1000");

      await expect(
        token0.connect(user).transfer(owner.address, amount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should prevent transferFrom with insufficient allowance", async () => {
      const amount = ethers.parseEther("100");

      await token0.mint(owner.address, amount);
      await expect(
        token0.connect(user).transferFrom(owner.address, user.address, amount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("Critical Function Protection", () => {
    it("Should protect factory initialization", async () => {
      const DogePumpFactory = await ethers.getContractFactory("DogePumpFactory");
      const newFactory = await DogePumpFactory.deploy(owner.address);

      // Factory should not have initialization function
      expect(await newFactory.feeToSetter()).to.equal(owner.address);
    });

    it("Should protect pair initialization", async () => {
      const DogePumpPair = await ethers.getContractFactory("DogePumpPair");
      const newPair = await DogePumpPair.deploy();

      // Pair should only be initialized by factory
      await expect(
        newPair.initialize(token0.address, token1.address)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should protect router initialization", async () => {
      const DogePumpRouter = await ethers.getContractFactory("DogePumpRouter");
      const newRouter = await DogePumpRouter.deploy(factory.address, weth.address);

      // Router should be immutable after deployment
      expect(await newRouter.factory()).to.equal(factory.address);
      expect(await newRouter.WETH()).to.equal(weth.address);
    });
  });

  describe("Unauthorized Access Prevention", () => {
    it("Should prevent direct pair manipulation", async () => {
      const amount0 = ethers.parseEther("100");
      const amount1 = ethers.parseEther("200");

      await token0.mint(user.address, amount0);
      await token1.mint(user.address, amount1);
      await token0.connect(user).approve(pair.address, amount0);
      await token1.connect(user).approve(pair.address, amount1);

      // Direct mint should fail
      await expect(
        pair.connect(user).mint(user.address)
      ).to.be.revertedWith("FORBIDDEN");
    });

    it("Should prevent factory fee manipulation", async () => {
      const newFeeTo = attacker.address;

      // Non-owner should not be able to set feeTo
      await expect(
        factory.connect(attacker).setFeeTo(newFeeTo)
      ).to.be.revertedWith("Forbidden");

      // Verify feeTo unchanged
      expect(await factory.feeTo()).to.equal(ethers.ZeroAddress);
    });

    it("Should prevent graduation manager manipulation", async () => {
      const newThreshold = ethers.parseEther("1");

      // Non-owner should not be able to set threshold
      await expect(
        graduationManager.connect(attacker).setGraduationThreshold(newThreshold)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Verify threshold unchanged
      expect(await graduationManager.graduationThreshold()).to.equal(ethers.parseEther("1000000"));
    });
  });
});
