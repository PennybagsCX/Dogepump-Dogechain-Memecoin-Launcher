const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("==========================================");
  console.log("Execute Timelocked Calls");
  console.log("==========================================");

  if (!process.env.KARMA_ADDRESS) {
    console.error("\nERROR: KARMA_ADDRESS not set in .env file");
    console.error("Please set KARMA_ADDRESS (deployed $KARMA token address)");
    process.exit(1);
  }

  const karmaAddress = process.env.KARMA_ADDRESS;
  const karma = await hre.ethers.getContractAt("KARMA", karmaAddress);

  console.log("\n$KARMA Token:", karmaAddress);

  // Get deployer (should be the caller)
  const [caller] = await hre.ethers.getSigners();
  console.log("Caller:", caller.address);

  // Execute setBuybackContract call
  console.log("\n==========================================");
  console.log("Executing Timelocked Calls");
  console.log("==========================================");

  try {
    console.log("\n1. Checking if setBuybackContract can be executed...");

    // Get the buyback contract address from deployment file or env
    const buybackAddress = process.env.KARMA_BUYBACK_ADDRESS;
    if (!buybackAddress) {
      console.error("ERROR: KARMA_BUYBACK_ADDRESS not set");
      process.exit(1);
    }

    // Generate the call ID
    const callId1 = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["string", "address"],
        ["setBuybackContract", buybackAddress]
      )
    );

    console.log("   Call ID:", callId1);

    // Check if call exists
    const timelockedCall = await karma.timelockedCalls(callId1);
    console.log("   Execute after:", new Date(timelockedCall.executeAfter.toNumber() * 1000).toISOString());
    console.log("   Executed:", timelockedCall.executed);
    console.log("   Caller:", timelockedCall.caller);

    const currentTime = Math.floor(Date.now() / 1000);
    const executeAfter = timelockedCall.executeAfter.toNumber();

    if (currentTime < executeAfter) {
      const waitTime = executeAfter - currentTime;
      console.log(`   ⚠️  Too early! Wait ${waitTime} seconds (${Math.floor(waitTime / 3600)} hours)`);
    } else if (timelockedCall.executed) {
      console.log("   ✓ Already executed");
    } else {
      console.log("   ✓ Ready to execute");

      console.log("\n   Executing setBuybackContract...");
      const tx = await karma.executeTimelockedCall(callId1);
      const receipt = await tx.wait();
      console.log("   ✓ Executed successfully");
      console.log("   Gas used:", receipt.gasUsed.toString());
    }
  } catch (error) {
    console.error("   ✗ Error:", error.message);
  }

  // Execute setStakingContract call
  try {
    console.log("\n2. Checking if setStakingContract can be executed...");

    const stakingAddress = process.env.KARMA_STAKING_ADDRESS;
    if (!stakingAddress) {
      console.error("ERROR: KARMA_STAKING_ADDRESS not set");
      process.exit(1);
    }

    const callId2 = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["string", "address"],
        ["setStakingContract", stakingAddress]
      )
    );

    console.log("   Call ID:", callId2);

    const timelockedCall = await karma.timelockedCalls(callId2);
    console.log("   Execute after:", new Date(timelockedCall.executeAfter.toNumber() * 1000).toISOString());
    console.log("   Executed:", timelockedCall.executed);
    console.log("   Caller:", timelockedCall.caller);

    const currentTime = Math.floor(Date.now() / 1000);
    const executeAfter = timelockedCall.executeAfter.toNumber();

    if (currentTime < executeAfter) {
      const waitTime = executeAfter - currentTime;
      console.log(`   ⚠️  Too early! Wait ${waitTime} seconds (${Math.floor(waitTime / 3600)} hours)`);
    } else if (timelockedCall.executed) {
      console.log("   ✓ Already executed");
    } else {
      console.log("   ✓ Ready to execute");

      console.log("\n   Executing setStakingContract...");
      const tx = await karma.executeTimelockedCall(callId2);
      const receipt = await tx.wait();
      console.log("   ✓ Executed successfully");
      console.log("   Gas used:", receipt.gasUsed.toString());
    }
  } catch (error) {
    console.error("   ✗ Error:", error.message);
  }

  console.log("\n==========================================");
  console.log("Verification");
  console.log("==========================================");

  try {
    const buyback = await karma.buybackContract();
    const staking = await karma.stakingContract();

    console.log("\nCurrent Configuration:");
    console.log("  Buyback Contract:", buyback);
    console.log("  Staking Contract:", staking);
    console.log("  Minting Enabled:", await karma.isMintingEnabled());

    if (buyback !== ethers.constants.AddressZero && staking !== ethers.constants.AddressZero) {
      console.log("\n✅ All contracts configured successfully!");
    } else {
      console.log("\n⚠️  Some contracts not yet configured");
    }
  } catch (error) {
    console.error("Error verifying configuration:", error.message);
  }

  console.log("\n==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Execution failed:");
    console.error(error);
    process.exit(1);
  });
