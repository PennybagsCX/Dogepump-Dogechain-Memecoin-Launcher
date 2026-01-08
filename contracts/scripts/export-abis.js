const fs = require("fs");
const path = require("path");

function exportABIs() {
  console.log("Exporting contract ABIs...");

  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  const abisDir = path.join(__dirname, "..", "abis");

  // Create abis directory if it doesn't exist
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // List of contracts to export
  const contracts = [
    "DogePumpFactory",
    "DogePumpPair",
    "DogePumpRouter",
    "DogePumpLPToken",
    "GraduationManager",
  ];

  // Export each contract ABI
  contracts.forEach((contractName) => {
    const contractPath = path.join(artifactsDir, contractName, `${contractName}.sol`, `${contractName}.json`);
    
    if (fs.existsSync(contractPath)) {
      const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));
      
      // Create simplified ABI file
      const abiPath = path.join(abisDir, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(contractData.abi, null, 2));
      
      console.log(`✓ Exported ${contractName}.json`);
    } else {
      console.log(`✗ ${contractName}.sol not found in artifacts`);
    }
  });

  // Create an index file with all ABIs
  const indexFile = path.join(abisDir, "index.js");
  const indexContent = contracts
    .map((name) => `export const ${name} = require('./${name}.json');`)
    .join("\n");
  
  fs.writeFileSync(indexFile, indexContent);
  console.log(`✓ Created index.js`);

  console.log("\nABIs exported successfully!");
  console.log(`Output directory: ${abisDir}`);
}

exportABIs();
