/**
 * Contract Performance Tests
 *
 * Performance tests for smart contract operations covering:
 * - Gas usage for swaps
 * - Gas usage for liquidity operations
 * - Batch operation performance
 * - Event emission performance
 *
 * NOTE: This test requires Hardhat and compiled typechain-types.
 * Run `npx hardhat compile` in the contracts directory first.
 * Excluded from vitest runs via vitest.config.ts.
 */
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { ethers } from 'hardhat';
import { 
  DogePumpFactory,
  DogePumpPair,
  DogePumpRouter,
  DogePumpLPToken,
  GraduationManager
} from '../../../typechain-types';

describe('Contract Performance Tests', () => {
  let factory: DogePumpFactory;
  let router: DogePumpRouter;
  let token0: any;
  let token1: any;
  let pair: DogePumpPair;
  let owner: any;
  let user1: any;

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
    
    // Deploy Factory
    const Factory = await ethers.getContractFactory('DogePumpFactory');
    factory = await Factory.deploy(owner.address);
    await factory.deployed();
    
    // Deploy Router
    const Router = await ethers.getContractFactory('DogePumpRouter');
    router = await Router.deploy(factory.address, owner.address);
    await router.deployed();
    
    // Deploy test tokens
    const Token = await ethers.getContractFactory('ERC20Mock');
    token0 = await Token.deploy('Token0', 'TK0', ethers.parseEther('1000000'));
    await token0.deployed();
    
    token1 = await Token.deploy('Token1', 'TK1', ethers.parseEther('1000000'));
    await token1.deployed();
    
    // Create pair
    await factory.createPair(token0.address, token1.address);
    const pairAddress = await factory.getPair(token0.address, token1.address);
    pair = await ethers.getContractAt('DogePumpPair', pairAddress);
  });

  describe('Gas Usage for Swaps', () => {
    it('should measure gas usage for swap exact tokens for tokens', async () => {
      // Add liquidity first
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Approve tokens for swap
      await token0.connect(user1).approve(router.address, ethers.parseEther('100'));
      
      // Measure gas for swap
      const tx = await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther('100'),
        0,
        [token0.address, token1.address],
        user1.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 200k)
      expect(gasUsed.toNumber()).toBeLessThan(200000);
      console.log(`swapExactTokensForTokens gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for swap tokens for exact tokens', async () => {
      // Add liquidity first
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Approve tokens for swap
      await token0.connect(user1).approve(router.address, ethers.parseEther('100'));
      
      // Measure gas for swap
      const tx = await router.connect(user1).swapTokensForExactTokens(
        ethers.parseEther('50'),
        ethers.parseEther('1000'),
        [token0.address, token1.address],
        user1.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 250k)
      expect(gasUsed.toNumber()).toBeLessThan(250000);
      console.log(`swapTokensForExactTokens gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for multi-hop swap', async () => {
      // Deploy third token
      const Token = await ethers.getContractFactory('ERC20Mock');
      const token2 = await Token.deploy('Token2', 'TK2', ethers.parseEther('1000000'));
      await token2.deployed();
      
      // Create pairs
      await factory.createPair(token0.address, token2.address);
      await factory.createPair(token2.address, token1.address);
      
      // Add liquidity to both pairs
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token2.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token0.address,
        token2.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      await token2.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token2.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Approve tokens for swap
      await token0.connect(user1).approve(router.address, ethers.parseEther('100'));
      
      // Measure gas for multi-hop swap
      const tx = await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther('100'),
        0,
        [token0.address, token2.address, token1.address],
        user1.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 300k)
      expect(gasUsed.toNumber()).toBeLessThan(300000);
      console.log(`multi-hop swap gas used: ${gasUsed.toString()}`);
    });
  });

  describe('Gas Usage for Liquidity Operations', () => {
    it('should measure gas usage for add liquidity', async () => {
      // Approve tokens
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      
      // Measure gas for add liquidity
      const tx = await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 400k)
      expect(gasUsed.toNumber()).toBeLessThan(400000);
      console.log(`addLiquidity gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for remove liquidity', async () => {
      // Add liquidity first
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Get LP tokens
      const lpToken = await ethers.getContractAt('DogePumpLPToken', await pair.address);
      const lpBalance = await lpToken.balanceOf(owner.address);
      
      // Measure gas for remove liquidity
      const tx = await router.removeLiquidity(
        token0.address,
        token1.address,
        lpBalance,
        0,
        owner.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 300k)
      expect(gasUsed.toNumber()).toBeLessThan(300000);
      console.log(`removeLiquidity gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for add liquidity with optimal amounts', async () => {
      // Approve tokens
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      
      // Add liquidity first
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Get reserves
      const reserves = await pair.getReserves();
      
      // Measure gas for add liquidity with optimal amounts
      const tx = await router.addLiquidity(
        token0.address,
        token1.address,
        reserves.reserve0,
        reserves.reserve1,
        0,
        owner.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 400k)
      expect(gasUsed.toNumber()).toBeLessThan(400000);
      console.log(`addLiquidity (optimal) gas used: ${gasUsed.toString()}`);
    });
  });

  describe('Batch Operation Performance', () => {
    it('should measure gas usage for multiple swaps in sequence', async () => {
      // Add liquidity
      await token0.connect(owner).approve(router.address, ethers.parseEther('10000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('10000'));
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('10000'),
        ethers.parseEther('10000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Approve tokens
      await token0.connect(user1).approve(router.address, ethers.parseEther('10000'));
      
      // Measure gas for 10 swaps in sequence
      const gasUsages = [];
      for (let i = 0; i < 10; i++) {
        const tx = await router.connect(user1).swapExactTokensForTokens(
          ethers.parseEther('100'),
          0,
          [token0.address, token1.address],
          user1.address,
          Date.now() + 3600
        );
        
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      // Calculate average gas usage
      const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      
      // Average gas usage should be reasonable
      expect(avgGas).toBeLessThan(200000);
      console.log(`Average swap gas used: ${avgGas}`);
      console.log(`Gas usages: ${gasUsages.join(', ')}`);
    });

    it('should measure gas usage for multiple add/remove operations', async () => {
      // Approve tokens
      await token0.connect(owner).approve(router.address, ethers.parseEther('100000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('100000'));
      
      // Measure gas for 5 add/remove cycles
      const gasUsages = [];
      for (let i = 0; i < 5; i++) {
        // Add liquidity
        const addTx = await router.addLiquidity(
          token0.address,
          token1.address,
          ethers.parseEther('1000'),
          ethers.parseEther('1000'),
          0,
          owner.address,
          Date.now() + 3600
        );
        const addReceipt = await addTx.wait();
        gasUsages.push(addReceipt.gasUsed.toNumber());
        
        // Get LP tokens
        const lpToken = await ethers.getContractAt('DogePumpLPToken', await pair.address);
        const lpBalance = await lpToken.balanceOf(owner.address);
        
        // Remove liquidity
        const removeTx = await router.removeLiquidity(
          token0.address,
          token1.address,
          lpBalance,
          0,
          owner.address,
          Date.now() + 3600
        );
        const removeReceipt = await removeTx.wait();
        gasUsages.push(removeReceipt.gasUsed.toNumber());
      }
      
      // Calculate average gas usage
      const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      
      // Average gas usage should be reasonable
      expect(avgGas).toBeLessThan(350000);
      console.log(`Average liquidity operation gas used: ${avgGas}`);
    });
  });

  describe('Event Emission Performance', () => {
    it('should measure gas usage for swap with events', async () => {
      // Add liquidity
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      // Approve tokens for swap
      await token0.connect(user1).approve(router.address, ethers.parseEther('100'));
      
      // Measure gas for swap with event emission
      const tx = await router.connect(user1).swapExactTokensForTokens(
        ethers.parseEther('100'),
        0,
        [token0.address, token1.address],
        user1.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Verify events were emitted
      expect(receipt.logs.length).toBeGreaterThan(0);
      
      // Gas usage should be reasonable
      expect(gasUsed.toNumber()).toBeLessThan(200000);
      console.log(`swap with events gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for add liquidity with events', async () => {
      // Approve tokens
      await token0.connect(owner).approve(router.address, ethers.parseEther('1000'));
      await token1.connect(owner).approve(router.address, ethers.parseEther('1000'));
      
      // Measure gas for add liquidity with event emission
      const tx = await router.addLiquidity(
        token0.address,
        token1.address,
        ethers.parseEther('1000'),
        ethers.parseEther('1000'),
        0,
        owner.address,
        Date.now() + 3600
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Verify events were emitted
      expect(receipt.logs.length).toBeGreaterThan(0);
      
      // Gas usage should be reasonable
      expect(gasUsed.toNumber()).toBeLessThan(400000);
      console.log(`addLiquidity with events gas used: ${gasUsed.toString()}`);
    });
  });

  describe('Pair Creation Performance', () => {
    it('should measure gas usage for pair creation', async () => {
      // Deploy new tokens
      const Token = await ethers.getContractFactory('ERC20Mock');
      const newToken0 = await Token.deploy('NewToken0', 'NTK0', ethers.parseEther('1000000'));
      await newToken0.deployed();
      
      const newToken1 = await Token.deploy('NewToken1', 'NTK1', ethers.parseEther('1000000'));
      await newToken1.deployed();
      
      // Measure gas for pair creation
      const tx = await factory.createPair(newToken0.address, newToken1.address);
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed;
      
      // Gas usage should be reasonable (less than 3M)
      expect(gasUsed.toNumber()).toBeLessThan(3000000);
      console.log(`createPair gas used: ${gasUsed.toString()}`);
    });

    it('should measure gas usage for pair initialization', async () => {
      // Get pair address
      const pairAddress = await factory.getPair(token0.address, token1.address);
      const newPair = await ethers.getContractAt('DogePumpPair', pairAddress);
      
      // Pair should already be initialized
      const factoryAddress = await newPair.factory();
      expect(factoryAddress).toBe(factory.address);
    });
  });
});
