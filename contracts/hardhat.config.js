require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
require("hardhat-gas-reporter");
require("solidity-coverage");

// DogePump DEX Configuration
const DOGECHAIN_TESTNET_RPC = process.env.DOGECHAIN_TESTNET_RPC || "https://rpc-testnet.dogechain.dog";
const DOGECHAIN_MAINNET_RPC = process.env.DOGECHAIN_MAINNET_RPC || "https://rpc.dogechain.dog";

const DOGECHAIN_TESTNET_EXPLORER = "https://explorer-testnet.dogechain.dog";
const DOGECHAIN_MAINNET_EXPLORER = "https://explorer.dogechain.dog";

// Token addresses
const DC_TOKEN = "0x7B4328c127B85369D9f82ca0503B000D09CF9180";
const WDOGE_TOKEN = "0xB7ddC6414bf4F5515b52D8BdD69973Ae205ff101";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: DOGECHAIN_MAINNET_RPC,
        enabled: true,
      },
      accounts: {
        count: 20,
        accountsBalance: "100000000000000000000", // 100k DC
      },
    },
    dogechain_testnet: {
      url: DOGECHAIN_TESTNET_RPC,
      chainId: 2000,
      accounts: {
        mnemonic: process.env.TESTNET_MNEMONIC || "",
      },
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1.2,
    },
    dogechain: {
      url: DOGECHAIN_MAINNET_RPC,
      chainId: 2000,
      accounts: {
        mnemonic: process.env.MAINNET_MNEMONIC || "",
      },
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1.2,
    },
  },
  etherscan: {
    apiKey: {
      dogechain_testnet: process.env.DOGECHAIN_TESTNET_API_KEY || "",
      dogechain: process.env.DOGECHAIN_MAINNET_API_KEY || "",
    },
    customChains: [
      {
        network: "dogechain_testnet",
        chainId: 2000,
        urls: {
          apiURL: DOGECHAIN_TESTNET_EXPLORER,
          browserURL: DOGECHAIN_TESTNET_EXPLORER,
        },
      },
      {
        network: "dogechain",
        chainId: 2000,
        urls: {
          apiURL: DOGECHAIN_MAINNET_EXPLORER,
          browserURL: DOGECHAIN_MAINNET_EXPLORER,
        },
      },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 20,
    showTimeSpent: true,
    showGasPrice: true,
    outputFile: "gas-report.txt",
    noColors: false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 40000,
    reporter: "mocha-multi-reporters",
    reporterOptions: {
      enableConsoleLogs: true,
      json: true,
      html: false,
    },
  },
};
