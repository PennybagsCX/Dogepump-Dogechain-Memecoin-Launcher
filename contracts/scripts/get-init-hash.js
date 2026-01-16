
const { ethers } = require("hardhat");

async function main() {
  const DogePumpPair = await ethers.getContractFactory("DogePumpPair");
  const bytecode = DogePumpPair.bytecode;
  const hash = ethers.keccak256(bytecode);
  console.log("DogePumpPair Init Code Hash:", hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
