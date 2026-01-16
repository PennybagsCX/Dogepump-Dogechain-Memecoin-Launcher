const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Function to read file content
function readFile(relativePath) {
    return fs.readFileSync(path.join(__dirname, relativePath), "utf8");
}

// Minimal compilation simulation or just reading the artifact if it existed.
// Since we don't have the artifact, we might need to rely on the source code.
// However, exact bytecode depends on compiler version and settings.
// A better approach in this environment might be to look for existing artifacts or use a hardhat task if available.
// But we can check if artifacts exist first.

const artifactsDir = path.join(__dirname, "../artifacts/contracts");
const pairArtifactPath = path.join(artifactsDir, "DogePumpPair.sol/DogePumpPair.json");

if (fs.existsSync(pairArtifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(pairArtifactPath, "utf8"));
    const bytecode = artifact.bytecode;
    const initCodeHash = ethers.keccak256(bytecode);
    console.log("Calculated Init Code Hash:", initCodeHash);
} else {
    console.log("Artifact not found at:", pairArtifactPath);
    console.log("Cannot calculate exact init code hash without compilation artifacts.");
}
