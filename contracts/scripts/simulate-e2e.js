
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
  console.log("Starting E2E Simulation on Hardhat Local Fork...");

  // 1. Setup Environment
  const [user] = await ethers.getSigners();
  console.log(`Simulating user: ${user.address}`);

  // Fetch contract addresses from deployment or hardcoded for simulation
  // For simulation, we will deploy a fresh set of contracts to the fork
  // because we don't have the private keys for the mainnet deployment to control it,
  // but we want to test the contract LOGIC with mainnet state (like if we interact with other tokens).
  // However, since we are testing the DEX core logic, a fresh deploy on fork is safer and cleaner.
  
  const DC_TOKEN_ADDRESS = "0x7B4328c127B85369D9f82ca0503B000D09CF9180"; // Real DC on Mainnet
  const WDOGE_ADDRESS = "0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101"; // Real wDOGE on Mainnet

  // 2. Deploy Contracts (Factory, Router)
  console.log("\nDeploying Core Contracts...");
  const DogePumpFactory = await ethers.getContractFactory("DogePumpFactory");
  const factory = await DogePumpFactory.deploy(user.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`Factory Deployed: ${factoryAddress}`);
  console.log(`Factory Address Valid: ${ethers.isAddress(factoryAddress)}`);

  console.log(`WDOGE Address: ${WDOGE_ADDRESS}`);
  console.log(`WDOGE Address Valid: ${ethers.isAddress(WDOGE_ADDRESS)}`);

  console.log(`Deploying Router with Factory: ${factoryAddress} and WDC: ${WDOGE_ADDRESS}`);
  const DogePumpRouter = await ethers.getContractFactory("DogePumpRouter");
  const router = await DogePumpRouter.deploy(factoryAddress, WDOGE_ADDRESS);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log(`Router Deployed: ${routerAddress}`);

  // 3. Setup Tokens (Mock tokens for testing swap if we don't have DC whale)
  // But wait, we can impersonate a whale on the fork to get DC tokens!
  console.log("\nImpersonating Whale to get DC tokens...");
  const DC_WHALE = "0x...some_whale_address..."; // We need to find a holder if we want real DC. 
  // Alternatively, we deploy Mock Tokens for the simulation to be self-contained.
  
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const tokenA = await ERC20Mock.deploy("Token A", "TKA", 18);
  await tokenA.waitForDeployment();
  const tokenB = await ERC20Mock.deploy("Token B", "TKB", 18);
  await tokenB.waitForDeployment();
  
  console.log(`Token A: ${await tokenA.getAddress()}`);
  console.log(`Token B: ${await tokenB.getAddress()}`);

  // Mint tokens to user
  await tokenA.mint(user.address, ethers.parseEther("10000"));
  await tokenB.mint(user.address, ethers.parseEther("10000"));
  console.log("Minted 10,000 TKA and TKB to user");

  // 4. Add Liquidity
  console.log("\nTest: Add Liquidity...");
  const amountA = ethers.parseEther("1000");
  const amountB = ethers.parseEther("1000");

  await tokenA.approve(await router.getAddress(), amountA);
  await tokenB.approve(await router.getAddress(), amountB);

  await router.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    amountA,
    amountB,
    0, // Slippage 0 for test
    0,
    user.address,
    Math.floor(Date.now() / 1000) + 1200
  );
  console.log("Liquidity Added Successfully");

  // Verify Pair Created
  const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
  console.log(`Pair Address: ${pairAddress}`);
  expect(pairAddress).to.not.equal(ethers.ZeroAddress);

  // 5. Swap
  console.log("\nTest: Swap TKA -> TKB...");
  const swapAmountIn = ethers.parseEther("10");
  await tokenA.approve(await router.getAddress(), swapAmountIn);

  const path = [await tokenA.getAddress(), await tokenB.getAddress()];
  
  // Check balance before
  const balanceBBefore = await tokenB.balanceOf(user.address);

  // Perform Swap
  await router.swapExactTokensForTokens(
    swapAmountIn,
    0, // Min out 0 for test
    path,
    user.address,
    Math.floor(Date.now() / 1000) + 1200
  );

  // Check balance after
  const balanceBAfter = await tokenB.balanceOf(user.address);
  console.log(`Balance TKB Before: ${ethers.formatEther(balanceBBefore)}`);
  console.log(`Balance TKB After:  ${ethers.formatEther(balanceBAfter)}`);
  
  expect(balanceBAfter).to.be.gt(balanceBBefore);
  console.log("Swap Successful!");

  // 6. Remove Liquidity
  console.log("\nTest: Remove Liquidity...");
  const pairContract = await ethers.getContractAt("DogePumpPair", pairAddress);
  const lpBalance = await pairContract.balanceOf(user.address);
  console.log(`LP Tokens: ${ethers.formatEther(lpBalance)}`);

  await pairContract.approve(await router.getAddress(), lpBalance);
  
  await router.removeLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    lpBalance,
    0,
    0,
    user.address,
    Math.floor(Date.now() / 1000) + 1200
  );
  
  const lpBalanceAfter = await pairContract.balanceOf(user.address);
  console.log(`LP Tokens After: ${ethers.formatEther(lpBalanceAfter)}`);
  expect(lpBalanceAfter).to.equal(0);
  console.log("Liquidity Removed Successfully!");

  console.log("\n=== E2E Simulation Completed Successfully ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
