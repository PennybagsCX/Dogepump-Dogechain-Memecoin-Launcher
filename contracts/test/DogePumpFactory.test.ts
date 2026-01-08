// @ts-nocheck
import { expect } from "chai";
import { ethers } from "hardhat";
import { DogePumpFactory } from "../typechain-types";
import { ERC20Mock } from "../typechain-types";
describe("DogePumpFactory", () => {
  let factory: DogePumpFactory;
  let token0: ERC20Mock;
  let token1: ERC20Mock;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mock tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token0 = await ERC20Mock.deploy("Token0", "T0", 18);
    token1 = await ERC20Mock.deploy("Token1", "T1", 18);

    // Deploy factory
    const DogePumpFactory = await ethers.getContractFactory("DogePumpFactory");
    factory = await DogePumpFactory.deploy(owner.address);
  });

  describe("Deployment", () => {
    it("Should set correct feeToSetter", async () => {
      expect(await factory.feeToSetter()).to.equal(owner.address);
    });

    it("Should set feeTo to zero address initially", async () => {
      expect(await factory.feeTo()).to.equal(ethers.ZeroAddress);
    });

    it("Should have zero pairs initially", async () => {
      expect(await factory.allPairsLength()).to.equal(0);
    });
  });

  describe("createPair", () => {
    it("Should create a new pair", async () => {
      const tx = await factory.createPair(token0.address, token1.address);
      const receipt = await tx.wait();

      // Check PairCreated event
      const event = receipt.events?.find((e: any) => e.event === "PairCreated");
      expect(event).to.not.be.undefined;
      expect(event.args.token0).to.equal(token0.address.toLowerCase());
      expect(event.args.token1).to.equal(token1.address.toLowerCase());
      expect(event.args.pair).to.not.equal(ethers.ZeroAddress);

      // Check pair mapping
      const pairAddress = await factory.getPair(token0.address, token1.address);
      expect(pairAddress).to.equal(event.args.pair);

      // Check reverse mapping
      const reversePairAddress = await factory.getPair(token1.address, token0.address);
      expect(reversePairAddress).to.equal(pairAddress);

      // Check allPairs array
      const allPairsLength = await factory.allPairsLength();
      expect(allPairsLength).to.equal(1);
      const pairAtIndex = await factory.allPairs(0);
      expect(pairAtIndex).to.equal(pairAddress);
    });

    it("Should sort tokens correctly", async () => {
      const tx = await factory.createPair(token1.address, token0.address);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === "PairCreated");
      expect(event.args.token0).to.equal(token0.address.toLowerCase());
      expect(event.args.token1).to.equal(token1.address.toLowerCase());
    });

    it("Should revert with identical addresses", async () => {
      await expect(
        factory.createPair(token0.address, token0.address)
      ).to.be.revertedWith("IdenticalAddresses");
    });

    it("Should revert with zero address", async () => {
      await expect(
        factory.createPair(ethers.ZeroAddress, token1.address)
      ).to.be.revertedWith("ZeroAddress");
    });

    it("Should revert if pair already exists", async () => {
      await factory.createPair(token0.address, token1.address);

      await expect(
        factory.createPair(token0.address, token1.address)
      ).to.be.revertedWith("PairExists");
    });

    it("Should create deterministic addresses", async () => {
      const tx1 = await factory.createPair(token0.address, token1.address);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.events?.find((e: any) => e.event === "PairCreated");
      const pair1Address = event1.args.pair;

      // Create same pair again (should fail)
      await expect(
        factory.createPair(token0.address, token1.address)
      ).to.be.revertedWith("PairExists");

      // Deploy another factory to test deterministic address
      const DogePumpFactory2 = await ethers.getContractFactory("DogePumpFactory");
      const factory2 = await DogePumpFactory.deploy(owner.address);

      const tx2 = await factory2.createPair(token0.address, token1.address);
      const receipt2 = await tx2.wait();
      const event2 = receipt2.events?.find((e: any) => e.event === "PairCreated");
      const pair2Address = event2.args.pair;

      // Addresses should be the same
      expect(pair2Address).to.equal(pair1Address);
    });
  });

  describe("setFeeTo", () => {
    it("Should allow feeToSetter to set feeTo", async () => {
      const newFeeTo = user.address;
      await factory.connect(owner).setFeeTo(newFeeTo);
      expect(await factory.feeTo()).to.equal(newFeeTo);
    });

    it("Should revert if not called by feeToSetter", async () => {
      await expect(
        factory.connect(user).setFeeTo(user.address)
      ).to.be.revertedWith("Forbidden");
    });
  });

  describe("setFeeToSetter", () => {
    it("Should allow current feeToSetter to set new feeToSetter", async () => {
      const newFeeToSetter = user.address;
      await factory.connect(owner).setFeeToSetter(newFeeToSetter);
      expect(await factory.feeToSetter()).to.equal(newFeeToSetter);
    });

    it("Should revert if not called by current feeToSetter", async () => {
      await expect(
        factory.connect(user).setFeeToSetter(user.address)
      ).to.be.revertedWith("Forbidden");
    });

    it("Should revert with zero address", async () => {
      await expect(
        factory.connect(owner).setFeeToSetter(ethers.ZeroAddress)
      ).to.be.revertedWith("ZeroAddress");
    });
  });

  describe("getPair", () => {
    it("Should return zero address for non-existent pair", async () => {
      const pairAddress = await factory.getPair(token0.address, token1.address);
      expect(pairAddress).to.equal(ethers.ZeroAddress);
    });
  });

  describe("allPairs", () => {
    it("Should return correct pair at index", async () => {
      await factory.createPair(token0.address, token1.address);

      const pairAddress = await factory.allPairs(0);
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should revert for out of bounds index", async () => {
      await expect(factory.allPairs(999)).to.be.reverted;
    });
  });
});
