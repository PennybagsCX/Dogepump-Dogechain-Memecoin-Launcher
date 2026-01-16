const hre = require("hardhat");
const { ethers } = hre;
const { DC_TOKEN, WDOGE_TOKEN } = require("../hardhat.config");

async function main() {
  console.log("==========================================");
  console.log("$KARMA Token System Deployment");
  console.log("==========================================");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  if (!process.env.MAINNET_MNEMONIC) {
    console.error("\nERROR: MAINNET_MNEMONIC not set in .env file");
    console.error("Please set MAINNET_MNEMONIC in your environment variables");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "DC");

  // Get DEX Router address (already deployed)
  const DOGEPUMP_ROUTER = process.env.DOGEPUMP_ROUTER || "0x..."; // Update with actual router address
  const DOGEPUMP_FACTORY = process.env.DOGEPUMP_FACTORY || "0x..."; // Update with actual factory address

  console.log("\n==========================================");
  console.log("Phase 1: Contract Deployment");
  console.log("==========================================");

  // Step 1: Deploy KARMA Token
  console.log("\n1. Deploying $KARMA Token...");
  console.log("   - Name: KARMA");
  console.log("   - Symbol: $KARMA");
  console.log("   - Max Supply: type(uint256).max");
  console.log("   - Mint Cap: type(uint112).max per transaction");

  const KARMA = await hre.ethers.getContractFactory("KARMA");
  const karma = await KARMA.deploy("KARMA", "$KARMA");
  await karma.deployed();
  console.log("   ✓ $KARMA Token deployed to:", karma.address);

  // Step 2: Deploy FeeCollector
  console.log("\n2. Deploying FeeCollector...");
  console.log("   - Fee Token: DC");
  console.log("   - Revenue Wallet:", deployer.address);

  const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
  const feeCollector = await FeeCollector.deploy(DC_TOKEN, deployer.address);
  await feeCollector.deployed();
  console.log("   ✓ FeeCollector deployed to:", feeCollector.address);

  // Step 3: Deploy KARMAStaking
  console.log("\n3. Deploying KARMAStaking...");
  console.log("   - KARMA Token:", karma.address);
  console.log("   - Fee Collector:", feeCollector.address);

  const KARMAStaking = await hre.ethers.getContractFactory("KARMAStaking");
  const karmaStaking = await KARMAStaking.deploy(karma.address, feeCollector.address);
  await karmaStaking.deployed();
  console.log("   ✓ KARMAStaking deployed to:", karmaStaking.address);

  // Step 4: Deploy KARMABuyback
  console.log("\n4. Deploying KARMABuyback...");
  console.log("   - KARMA Token:", karma.address);
  console.log("   - Fee Token: DC");
  console.log("   - DEX Router:", DOGEPUMP_ROUTER);
  console.log("   - Staking Contract:", karmaStaking.address);

  const KARMABuyback = await hre.ethers.getContractFactory("KARMABuyback");
  const karmaBuyback = await KARMABuyback.deploy(
    karma.address,
    DC_TOKEN,
    DOGEPUMP_ROUTER
  );
  await karmaBuyback.deployed();
  console.log("   ✓ KARMABuyback deployed to:", karmaBuyback.address);

  console.log("\n==========================================");
  console.log("Phase 2: Contract Configuration");
  console.log("==========================================");

  // Configure KARMA Token
  console.log("\n5. Configuring $KARMA Token...");

  console.log("   a) Setting buyback contract address...");
  const tx1 = await karma.setBuybackContract(karmaBuyback.address);
  await tx1.wait();
  console.log("      ✓ Call queued (2-day timelock)");

  console.log("   b) Setting staking contract address...");
  const tx2 = await karma.setStakingContract(karmaStaking.address);
  await tx2.wait();
  console.log("      ✓ Call queued (2-day timelock)");

  // Configure FeeCollector
  console.log("\n6. Configuring FeeCollector...");
  const tx3 = await feeCollector.setBuybackContract(karmaBuyback.address);
  await tx3.wait();
  console.log("   ✓ Buyback contract set");

  // Configure KARMAStaking
  console.log("\n7. Configuring KARMAStaking...");
  const tx4 = await karmaStaking.setFeeCollector(feeCollector.address);
  await tx4.wait();
  console.log("   ✓ Fee collector set");

  // Configure KARMABuyback
  console.log("\n8. Configuring KARMABuyback...");
  const tx5 = await karmaBuyback.setStakingContract(karmaStaking.address);
  await tx5.wait();
  console.log("   ✓ Staking contract set");

  // Approve DEX Router for buyback
  console.log("\n9. Approving DEX Router for buyback operations...");
  const maxAmount = ethers.constants.MaxUint256;
  const tx6 = await karmaBuyback.approveRouter(DOGEPUMP_ROUTER, maxAmount);
  await tx6.wait();
  console.log("   ✓ DEX Router approved for max amount");

  console.log("\n==========================================");
  console.log("Phase 3: Initial Liquidity Setup");
  console.log("==========================================");

  // Mint max supply to deployer
  console.log("\n10. Minting max supply to deployer...");
  const maxSupply = ethers.constants.MaxUint256;
  const tx7 = await karma.mint(deployer.address, maxSupply);
  await tx7.wait();
  console.log("   ✓ Max supply minted");

  // Get actual minted amount (may be less than MaxUint256 due to cap)
  const karmaBalance = await karma.balanceOf(deployer.address);
  console.log("   Actual $KARMA balance:", ethers.utils.formatEther(karmaBalance));

  // Approve DEX Router
  console.log("\n11. Approving DEX Router for liquidity...");
  const tx8 = await karma.approve(DOGEPUMP_ROUTER, maxAmount);
  await tx8.wait();
  console.log("   ✓ $KARMA approved");

  // Approve DC token
  const dcToken = await hre.ethers.getContractAt("IERC20", DC_TOKEN);
  const DC_AMOUNT = ethers.utils.parseEther("1000"); // 1000 $DC
  const tx9 = await dcToken.approve(DOGEPUMP_ROUTER, DC_AMOUNT);
  await tx9.wait();
  console.log("   ✓ 1000 $DC approved");

  // Add liquidity
  console.log("\n12. Adding initial liquidity to DEX...");
  console.log("    - $KARMA Amount:", ethers.utils.formatEther(karmaBalance));
  console.log("    - $DC Amount: 1000");

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const tx10 = await hre.ethers.getContractAt("IDexRouter", DOGEPUMP_ROUTER).then(router =>
    router.addLiquidity(
      karma.address,
      DC_TOKEN,
      karmaBalance,
      DC_AMOUNT,
      karmaBalance.mul(95).div(100), // 5% slippage
      DC_AMOUNT.mul(95).div(100),
      deployer.address,
      deadline
    )
  );
  const receipt = await tx10.wait();
  console.log("   ✓ Liquidity added successfully");
  console.log("   Gas used:", receipt.gasUsed.toString());

  console.log("\n==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log("\nContract Addresses:");
  console.log("  $KARMA Token:        ", karma.address);
  console.log("  KARMAStaking:        ", karmaStaking.address);
  console.log("  KARMABuyback:        ", karmaBuyback.address);
  console.log("  FeeCollector:        ", feeCollector.address);
  console.log("\nConfiguration:");
  console.log("  DEX Router:          ", DOGEPUMP_ROUTER);
  console.log("  DEX Factory:         ", DOGEPUMP_FACTORY);
  console.log("  DC Token:            ", DC_TOKEN);
  console.log("  WDOGE Token:         ", WDOGE_TOKEN);
  console.log("\nInitial Liquidity:");
  console.log("  $KARMA/$DC Pair:     Will be created by addLiquidity");
  console.log("  $KARMA Amount:       ", ethers.utils.formatEther(karmaBalance));
  console.log("  $DC Amount:          1000");
  console.log("\nDeployer:             ", deployer.address);
  console.log("Timestamp:            ", new Date().toISOString());

  // Save deployment addresses
  const deployment = {
    network: "dogechain-mainnet",
    chainId: 2000,
    contracts: {
      karma: karma.address,
      karmaStaking: karmaStaking.address,
      karmaBuyback: karmaBuyback.address,
      feeCollector: feeCollector.address,
    },
    existingContracts: {
      dogepumpRouter: DOGEPUMP_ROUTER,
      dogepumpFactory: DOGEPUMP_FACTORY,
      dcToken: DC_TOKEN,
      wdogeToken: WDOGE_TOKEN,
    },
    initialLiquidity: {
      karmaAmount: karmaBalance.toString(),
      dcAmount: DC_AMOUNT.toString(),
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "karma-mainnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("\n✓ Deployment addresses saved to:", deploymentFile);

  // Print verification commands
  console.log("\n==========================================");
  console.log("Contract Verification Commands");
  console.log("==========================================");
  console.log("\nExecute these commands to verify contracts on DogeChain explorer:\n");
  console.log(`npx hardhat verify --network dogechain ${karma.address} "KARMA" "\\$KARMA"`);
  console.log(`npx hardhat verify --network dogechain ${feeCollector.address} "${DC_TOKEN}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network dogechain ${karmaStaking.address} "${karma.address}" "${feeCollector.address}"`);
  console.log(`npx hardhat verify --network dogechain ${karmaBuyback.address} "${karma.address}" "${DC_TOKEN}" "${DOGEPUMP_ROUTER}"`);

  console.log("\n==========================================");
  console.log("⚠️  IMPORTANT POST-DEPLOYMENT STEPS");
  console.log("==========================================");
  console.log("\n1. Execute timelocked calls (after 2 days):");
  console.log("   - karma.setBuybackContract()");
  console.log("   - karma.setStakingContract()");
  console.log("\n2. Verify contracts on explorer");
  console.log("\n3. Test all contract functions");
  console.log("\n4. Monitor buyback execution");
  console.log("\n5. Set up staking dashboard frontend");
  console.log("\n6. Deploy backend API endpoints");
  console.log("\n==========================================");
  console.log("✅ Deployment completed successfully!");
  console.log("==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
