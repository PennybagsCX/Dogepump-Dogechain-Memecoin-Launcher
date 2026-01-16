const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==========================================");
  console.log("$KARMA Token System Status");
  console.log("==========================================\n");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", "karma-mainnet.json");

  if (!fs.existsSync(deploymentFile)) {
    console.error("ERROR: Deployment file not found:", deploymentFile);
    console.error("Please deploy contracts first using: npm run deploy:karma:mainnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("Network:", deployment.network);
  console.log("Chain ID:", deployment.chainId);
  console.log("Deployed:", new Date(deployment.timestamp).toISOString());
  console.log("Deployer:", deployment.deployer);

  // Get contract addresses
  const karmaAddress = deployment.contracts.karma;
  const stakingAddress = deployment.contracts.karmaStaking;
  const buybackAddress = deployment.contracts.karmaBuyback;
  const feeCollectorAddress = deployment.contracts.feeCollector;

  console.log("\n==========================================");
  console.log("Contract Addresses");
  console.log("==========================================");
  console.log("$KARMA Token:    ", karmaAddress);
  console.log("KARMAStaking:    ", stakingAddress);
  console.log("KARMABuyback:    ", buybackAddress);
  console.log("FeeCollector:    ", feeCollectorAddress);

  // Connect to contracts
  const karma = await hre.ethers.getContractAt("KARMA", karmaAddress);
  const staking = await hre.ethers.getContractAt("KARMAStaking", stakingAddress);
  const buyback = await hre.ethers.getContractAt("KARMABuyback", buybackAddress);
  const feeCollector = await hre.ethers.getContractAt("FeeCollector", feeCollectorAddress);

  console.log("\n==========================================");
  console.log("$KARMA Token Status");
  console.log("==========================================");

  try {
    const details = await karma.getTokenDetails();
    console.log("\nToken Details:");
    console.log("  Name:              ", details.name);
    console.log("  Symbol:            ", details.symbol);
    console.log("  Total Supply:      ", ethers.utils.formatEther(details.supply));
    console.log("  Max Supply:        ", details.maxSupply);
    console.log("  Remaining Supply:  ", ethers.utils.formatEther(details.remaining));
    console.log("  Minting Active:    ", details.mintingActive);

    console.log("\nConfiguration:");
    console.log("  Buyback Contract:  ", await karma.buybackContract());
    console.log("  Staking Contract:  ", await karma.stakingContract());
    console.log("  Owner:             ", await karma.owner());

    // Check timelocked calls
    console.log("\nTimelocked Calls:");
    const buybackAddr = await karma.buybackContract();
    const stakingAddr = await karma.stakingContract();

    if (buybackAddr !== ethers.constants.AddressZero) {
      console.log("  ✓ Buyback contract configured");
    } else {
      console.log("  ⏳ Buyback contract pending (timelocked)");
    }

    if (stakingAddr !== ethers.constants.AddressZero) {
      console.log("  ✓ Staking contract configured");
    } else {
      console.log("  ⏳ Staking contract pending (timelocked)");
    }
  } catch (error) {
    console.error("Error reading $KARMA token:", error.message);
  }

  console.log("\n==========================================");
  console.log("KARMAStaking Status");
  console.log("==========================================");

  try {
    const stats = await staking.getContractStats();
    console.log("\nContract Stats:");
    console.log("  Total Staked:       ", ethers.utils.formatEther(stats.totalStaked));
    console.log("  Total Rewards:      ", ethers.utils.formatEther(stats.totalRewardsDistributed));
    console.log("  Total Stakers:      ", stats.totalStakers.toString());
    console.log("  Current APY:        ", stats.currentAPY.toString(), "basis points");

    console.log("\nConfiguration:");
    console.log("  KARMA Token:        ", await staking.karmaToken());
    console.log("  Fee Collector:      ", await staking.feeCollector());
    console.log("  Owner:              ", await staking.owner());
    console.log("  Paused:             ", await staking.paused());
    console.log("  Launch Timestamp:   ", (await staking.launchTimestamp()).toString());

    const apy = await staking.calculateCurrentAPY();
    console.log("\nCalculated APY:");
    console.log("  Current APY:        ", apy.toString(), "basis points (", (apy / 100).toFixed(2), "%)");
  } catch (error) {
    console.error("Error reading KARMAStaking:", error.message);
  }

  console.log("\n==========================================");
  console.log("KARMABuyback Status");
  console.log("==========================================");

  try {
    const status = await buyback.getStatus();
    console.log("\nStatus:");
    console.log("  Buyback Enabled:    ", status.buybackEnabled);
    console.log("  Last Buyback:       ", status.lastBuybackTime.toString());
    console.log("  Staking Contract:   ", status.stakingContract);
    console.log("  KARMA Balance:      ", ethers.utils.formatEther(status.karmaBalance));
    console.log("  Fee Token Balance:  ", ethers.utils.formatEther(status.feeBalance));

    console.log("\nConfiguration:");
    console.log("  KARMA Token:        ", await buyback.karmaToken());
    console.log("  Fee Token:          ", await buyback.feeToken());
    console.log("  DEX Router:         ", await buyback.dexRouter());
    console.log("  Owner:              ", await buyback.owner());
  } catch (error) {
    console.error("Error reading KARMABuyback:", error.message);
  }

  console.log("\n==========================================");
  console.log("FeeCollector Status");
  console.log("==========================================");

  try {
    console.log("\nBalances:");
    const dcToken = await hre.ethers.getContractAt("IERC20", deployment.existingContracts.dcToken);
    const feeCollectorBalance = await dcToken.balanceOf(feeCollectorAddress);
    console.log("  Fee Token Balance:  ", ethers.utils.formatEther(feeCollectorBalance));

    console.log("\nConfiguration:");
    console.log("  Fee Token:          ", await feeCollector.feeToken());
    console.log("  Buyback Contract:   ", await feeCollector.buybackContract());
    console.log("  Revenue Wallet:     ", await feeCollector.revenueWallet());
    console.log("  Owner:              ", await feeCollector.owner());

    console.log("\nBuyback Fees:");
    const buybackFees = await feeCollector.getBuybackFees();
    console.log("  Available:          ", ethers.utils.formatEther(buybackFees));
  } catch (error) {
    console.error("Error reading FeeCollector:", error.message);
  }

  console.log("\n==========================================");
  console.log("Initial Liquidity");
  console.log("==========================================");
  console.log("  $KARMA Amount:       ", ethers.utils.formatEther(deployment.initialLiquidity.karmaAmount));
  console.log("  $DC Amount:          ", ethers.utils.formatEther(deployment.initialLiquidity.dcAmount));

  console.log("\n==========================================");
  console.log("System Health Check");
  console.log("==========================================");

  const healthChecks = [];

  // Check if contracts are configured
  const buybackContract = await karma.buybackContract();
  const stakingContract = await karma.stakingContract();

  if (buybackContract !== ethers.constants.AddressZero) {
    healthChecks.push({ check: "Buyback Contract Configured", status: "✅ PASS" });
  } else {
    healthChecks.push({ check: "Buyback Contract Configured", status: "⏳ PENDING" });
  }

  if (stakingContract !== ethers.constants.AddressZero) {
    healthChecks.push({ check: "Staking Contract Configured", status: "✅ PASS" });
  } else {
    healthChecks.push({ check: "Staking Contract Configured", status: "⏳ PENDING" });
  }

  // Check if buyback can access fees
  const buybackInFeeCollector = await feeCollector.buybackContract();
  if (buybackInFeeCollector.toLowerCase() === buybackAddress.toLowerCase()) {
    healthChecks.push({ check: "Buyback Authorized", status: "✅ PASS" });
  } else {
    healthChecks.push({ check: "Buyback Authorized", status: "❌ FAIL" });
  }

  // Check if staking is configured in buyback
  const stakingInBuyback = await buyback.stakingContract();
  if (stakingInBuyback.toLowerCase() === stakingAddress.toLowerCase()) {
    healthChecks.push({ check: "Staking Configured in Buyback", status: "✅ PASS" });
  } else {
    healthChecks.push({ check: "Staking Configured in Buyback", status: "❌ FAIL" });
  }

  // Check if minting is enabled
  const mintingEnabled = await karma.isMintingEnabled();
  if (mintingEnabled) {
    healthChecks.push({ check: "Minting Enabled", status: "✅ PASS" });
  } else {
    healthChecks.push({ check: "Minting Enabled", status: "⚠️  DISABLED" });
  }

  console.log("");
  healthChecks.forEach(({ check, status }) => {
    console.log(`  ${status}  ${check}`);
  });

  const allPassed = healthChecks.every(h => h.status.includes("PASS"));
  const pendingItems = healthChecks.filter(h => h.status.includes("PENDING")).length;

  console.log("\n==========================================");
  if (allPassed) {
    console.log("✅ System Fully Operational");
  } else if (pendingItems > 0) {
    console.log(`⏳ ${pendingItems} item(s) pending (awaiting timelock execution)`);
  } else {
    console.log("⚠️  System has issues that need attention");
  }
  console.log("==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Status check failed:");
    console.error(error);
    process.exit(1);
  });
