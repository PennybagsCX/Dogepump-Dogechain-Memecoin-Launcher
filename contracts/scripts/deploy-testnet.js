const hre = require("hardhat");
const { ethers } = hre;
const { DC_TOKEN, WDOGE_TOKEN } = require("../hardhat.config");

async function main() {
  console.log("Deploying DogePump DEX to Dogechain Testnet...");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy DogePumpFactory
  console.log("\n1. Deploying DogePumpFactory...");
  const DogePumpFactory = await hre.ethers.getContractFactory("DogePumpFactory");
  const factory = await DogePumpFactory.deploy(deployer.address);
  await factory.deployed();
  console.log("DogePumpFactory deployed to:", factory.address);

  // Deploy DogePumpRouter
  console.log("\n2. Deploying DogePumpRouter...");
  const DogePumpRouter = await hre.ethers.getContractFactory("DogePumpRouter");
  const router = await DogePumpRouter.deploy(factory.address, WDOGE_TOKEN);
  await router.deployed();
  console.log("DogePumpRouter deployed to:", router.address);

  // Deploy GraduationManager
  console.log("\n3. Deploying GraduationManager...");
  const GraduationManager = await hre.ethers.getContractFactory("GraduationManager");
  const graduationManager = await GraduationManager.deploy(
    factory.address,
    router.address,
    DC_TOKEN,
    deployer.address, // Price oracle (using deployer as placeholder)
    ethers.utils.parseEther("6900") // $6,900 graduation threshold
  );
  await graduationManager.deployed();
  console.log("GraduationManager deployed to:", graduationManager.address);

  // Create DC/wDOGE pair
  console.log("\n4. Creating DC/wDOGE pair...");
  const tx = await factory.createPair(DC_TOKEN, WDOGE_TOKEN);
  const receipt = await tx.wait();
  
  // Extract pair address from event
  const pairCreatedEvent = receipt.events.find(e => e.event === "PairCreated");
  const dcWdogePair = pairCreatedEvent.args.pair;
  console.log("DC/wDOGE pair created:", dcWdogePair);

  // Verify deployment
  console.log("\n=== Deployment Summary ===");
  console.log("Factory:", factory.address);
  console.log("Router:", router.address);
  console.log("GraduationManager:", graduationManager.address);
  console.log("DC/wDOGE Pair:", dcWdogePair);
  console.log("\nDeployment completed successfully!");

  // Save deployment addresses
  const deployment = {
    network: "dogechain-testnet",
    chainId: 2000,
    factory: factory.address,
    router: router.address,
    graduationManager: graduationManager.address,
    dcWdogePair: dcWdogePair,
    dcToken: DC_TOKEN,
    wdogeToken: WDOGE_TOKEN,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment addresses saved to:", deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
