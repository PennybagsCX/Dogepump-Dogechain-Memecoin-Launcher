# DEX Glossary

Complete glossary of DEX, blockchain, and DeFi terminology.

## Table of Contents

- [DEX Terminology](#dex-terminology)
- [Blockchain Terminology](#blockchain-terminology)
- [DeFi Terminology](#defi-terminology)
- [Acronyms and Abbreviations](#acronyms-and-abbreviations)

---

## DEX Terminology

### A

#### AMM (Automated Market Maker)

A type of decentralized exchange that uses algorithmic formulas to price assets instead of traditional order books. Dogepump DEX uses the constant product AMM formula (x * y = k).

**Example**: Uniswap, SushiSwap, Dogepump DEX

#### APY (Annual Percentage Yield)

The annual rate of return on an investment, taking into account the effect of compounding interest. In DeFi, APY is often used to express the return on liquidity provision.

**Formula**: APY = (1 + r/n)^n - 1

**Example**: If you provide liquidity and earn 15% APY, you'll earn approximately 15% on your investment over a year, assuming rewards are reinvested.

#### Arbitrage

The practice of taking advantage of a price difference between two or more markets. Arbitrageurs buy assets in one market and sell them in another to profit from the price difference.

**Example**: If Token A costs $1.00 on Dogepump DEX but $1.05 on another exchange, an arbitrageur could buy on Dogepump DEX and sell on the other exchange for a $0.05 profit.

#### Approval

A transaction that authorizes a smart contract to spend tokens on your behalf. Required before swapping or adding liquidity.

**Example**: Before swapping DC for wDOGE, you must approve the Router contract to spend your DC tokens.

### B

#### Burn

The process of permanently removing tokens from circulation. In AMMs, LP tokens are burned when liquidity is removed.

**Example**: When you remove liquidity, your LP tokens are burned and you receive your share of the pool's tokens.

### C

#### Constant Product Formula

The mathematical formula used by many AMMs: x * y = k, where x and y are the reserves of two tokens in a pool, and k is a constant. This ensures that the product of the reserves always remains the same.

**Formula**: x * y = k

**Example**: If a pool has 100 DC and 200 wDOGE, the constant k = 20,000. If someone swaps 10 DC for wDOGE, the pool will have 110 DC and approximately 181.82 wDOGE (110 * 181.82 ≈ 20,000).

#### CEX (Centralized Exchange)

A cryptocurrency exchange that operates as a traditional financial institution, with a central authority that manages trades and holds user funds.

**Example**: Binance, Coinbase, Kraken

#### Cross-Chain Bridge

A protocol that enables the transfer of assets between different blockchains.

**Example**: A bridge that allows you to transfer DOGE from Ethereum to Dogechain.

### D

#### DEX (Decentralized Exchange)

A cryptocurrency exchange that operates without a central authority, using smart contracts to facilitate peer-to-peer trading.

**Example**: Uniswap, SushiSwap, Dogepump DEX

#### Deadline

A timestamp after which a transaction will fail. Used to prevent transactions from being stuck in the mempool for too long.

**Example**: Set a deadline of 20 minutes from now to ensure your swap executes within that time window.

#### Direct Swap

A swap between two tokens that have a direct trading pool.

**Example**: Swapping DC for wDOGE directly through the DC/wDOGE pool.

### E

#### EVM (Ethereum Virtual Machine)

A runtime environment for executing smart contracts. Dogechain is EVM-compatible, meaning it can run Ethereum smart contracts.

**Example**: Solidity contracts written for Ethereum can be deployed on Dogechain with minimal changes.

### F

#### Flash Loan

An uncollateralized loan that must be repaid within the same transaction block. Used for arbitrage, collateral swapping, and other complex DeFi operations.

**Example**: Borrow 1,000,000 DC, use it for arbitrage, and repay the loan within the same transaction.

#### Front-Running

The practice of placing orders ahead of known future transactions to profit from the price movement. Considered unethical and often mitigated by DEXs.

**Example**: Seeing a large swap in the mempool and placing a similar swap before it executes to profit from the price impact.

### G

#### Gas

The unit of measurement for computational effort on the blockchain. Users pay gas fees to execute transactions.

**Example**: A swap might cost 150,000 gas. If gas price is 50 gwei, the total cost is 150,000 * 50 gwei = 7,500,000 gwei = 0.0075 ETH.

#### Gas Limit

The maximum amount of gas units a user is willing to spend on a transaction.

**Example**: Set a gas limit of 200,000 to ensure your transaction doesn't exceed that amount.

#### Gas Price

The amount of gwei per unit of gas. Higher gas prices result in faster transaction confirmation.

**Example**: Gas price of 50 gwei means you're paying 50 gwei for each unit of gas.

#### Gwei

A denomination of ETH (or DOGE on Dogechain) equal to 0.000000001 ETH.

**Example**: 50 gwei = 0.00000005 ETH

### I

#### Impermanent Loss

The temporary loss of funds experienced by liquidity providers when the price of their deposited assets changes relative to when they were deposited. The loss becomes "permanent" only when liquidity is removed.

**Formula**: IL = (2 * √(P1/P0)) / (1 + P1/P0) - 1

**Example**: If you deposit 100 DC and 200 wDOGE (worth $300 total), and the price of DC doubles, your pool might be worth $350 if held, but only $320 if in the pool. The $30 difference is impermanent loss.

### L

#### Liquidity

The availability of assets for trading. High liquidity means large trades can be executed without significantly affecting the price.

**Example**: A pool with $1,000,000 TVL has high liquidity, while a pool with $1,000 TVL has low liquidity.

#### Liquidity Pool

A smart contract that holds a reserve of two or more tokens, enabling users to trade against these reserves.

**Example**: The DC/wDOGE pool holds DC and wDOGE tokens, allowing users to swap between them.

#### Liquidity Provider (LP)

A user who deposits tokens into a liquidity pool to facilitate trading and earn fees.

**Example**: You deposit 100 DC and 200 wDOGE into the DC/wDOGE pool, becoming an LP.

#### LP Token

A token representing a liquidity provider's share in a liquidity pool. LP tokens can be staked, transferred, or burned to remove liquidity.

**Example**: After providing liquidity to the DC/wDOGE pool, you receive LP-DC-wDOGE tokens representing your share.

### M

#### Market Maker

An entity that provides liquidity to a market by buying and selling assets, profiting from the bid-ask spread. In AMMs, liquidity providers act as market makers.

**Example**: Uniswap liquidity providers are market makers for the pools they participate in.

#### MEV (Maximal Extractable Value)

The maximum value that can be extracted from block production in excess of the standard block reward and gas fees. Includes front-running, back-running, and sandwich attacks.

**Example**: A miner or validator reorders transactions to profit from price movements.

#### Mint

The process of creating new tokens. In AMMs, LP tokens are minted when liquidity is added.

**Example**: When you add liquidity to a pool, new LP tokens are minted and sent to your address.

#### Multi-Hop Swap

A swap that goes through multiple pools to reach the desired output token. Used when no direct pool exists between the input and output tokens.

**Example**: Swapping Token A for Token C by going Token A → DC → Token C.

### N

#### Network Congestion

A situation where there are more transactions than the network can process, leading to higher gas fees and slower confirmation times.

**Example**: During high activity periods on Dogechain, gas prices may increase significantly.

#### Nonce

A number used to ensure that each transaction is unique and processed in order.

**Example**: If your last transaction had nonce 10, your next transaction will have nonce 11.

### O

#### Oracle

A service that provides external data to smart contracts. Price oracles provide current market prices.

**Example**: Chainlink provides price feeds for various tokens.

#### Order Book

A list of buy and sell orders for a particular asset, used by CEXs to match buyers and sellers.

**Example**: Binance uses an order book to match buy and sell orders for BTC/USDT.

### P

#### Pair

Two tokens that can be traded against each other in a liquidity pool.

**Example**: DC/wDOGE is a trading pair.

#### Pool

See Liquidity Pool.

#### Price Impact

The effect a trade has on the market price of an asset. Larger trades in pools with lower liquidity have higher price impact.

**Example**: Swapping $1,000 worth of tokens in a $10,000 pool will have a higher price impact than swapping $1,000 in a $1,000,000 pool.

### R

#### Reentrancy

A type of attack where a malicious contract calls back into the calling contract before the first invocation is complete, potentially causing unexpected behavior.

**Example**: An attacker exploits a contract that transfers ETH before updating balances, allowing them to withdraw multiple times.

#### Reserve

The amount of tokens held in a liquidity pool.

**Example**: The DC/wDOGE pool has reserves of 100,000 DC and 200,000 wDOGE.

#### Router

A smart contract that facilitates complex operations like multi-hop swaps and liquidity management.

**Example**: The DogePumpRouter contract handles swaps and liquidity operations.

### S

#### Slippage

The difference between the expected price of a trade and the price at which the trade is actually executed. Slippage tolerance is the maximum acceptable slippage for a trade.

**Example**: If you expect to receive 200 wDOGE but only receive 195 wDOGE, you experienced 2.5% slippage.

#### Slippage Tolerance

The maximum acceptable price impact for a trade. If the actual slippage exceeds this tolerance, the transaction fails.

**Example**: Set slippage tolerance to 1% to ensure your trade doesn't execute if the price moves more than 1% against you.

#### Smart Contract

A self-executing contract with the terms of the agreement between buyer and seller being directly written into lines of code.

**Example**: The DogePumpPair contract automatically executes swaps based on the constant product formula.

#### Staking

The process of locking up tokens to earn rewards. In DeFi, LP tokens are often staked to earn additional rewards.

**Example**: Stake your LP-DC-wDOGE tokens to earn DC rewards.

#### Swap

The act of exchanging one token for another.

**Example**: Swap 100 DC for 200 wDOGE.

### T

#### TVL (Total Value Locked)

The total value of assets deposited in a DeFi protocol. Used as a metric for protocol popularity and liquidity.

**Example**: If the DC/wDOGE pool has 100,000 DC ($100,000) and 200,000 wDOGE ($200,000), the TVL is $300,000.

#### TWAP (Time-Weighted Average Price)

An oracle that calculates the average price of an asset over a period of time, making it resistant to manipulation.

**Example**: Dogepump DEX uses TWAP to protect against price manipulation attacks.

#### Token

A digital asset built on a blockchain. Can represent currency, utility, or ownership.

**Example**: DC (Dogecoin), wDOGE (Wrapped DOGE), USDC (USD Coin).

#### Token Approval

See Approval.

#### Transaction Hash

A unique identifier for a transaction on the blockchain.

**Example**: 0x1234...abcd is a transaction hash.

### V

#### Volatility

The degree of variation in the price of an asset over time. High volatility means prices change rapidly.

**Example**: Memecoins often have high volatility, while stablecoins have low volatility.

### W

#### Wallet

A software or hardware device that stores private keys and allows users to interact with the blockchain.

**Example**: MetaMask, Trust Wallet, Ledger.

#### Wrapped Token

A token that represents another asset on a different blockchain. Used to enable cross-chain compatibility.

**Example**: wDOGE is a wrapped version of DOGE on Dogechain.

---

## Blockchain Terminology

### A

#### Address

A unique identifier for a user or smart contract on the blockchain. Addresses are derived from public keys.

**Example**: 0x1234...abcd is a blockchain address.

#### Altcoin

Any cryptocurrency other than Bitcoin.

**Example**: Ethereum, Dogecoin, Solana are altcoins.

#### Block

A container for transaction data on the blockchain. Blocks are added to the blockchain sequentially.

**Example**: Each block on Dogechain contains a list of transactions.

#### Block Explorer

A website that allows users to view information about blocks, transactions, and addresses on a blockchain.

**Example**: https://explorer.dogechain.dog is the Dogechain block explorer.

#### Block Height

The number of blocks that have been added to the blockchain since its genesis block.

**Example**: Block height 1,000,000 means 1,000,000 blocks have been mined.

#### Blockchain

A distributed ledger that records transactions across multiple computers. Each block contains a cryptographic hash of the previous block, creating a chain.

**Example**: Bitcoin, Ethereum, Dogechain are blockchains.

### C

#### Chain ID

A unique identifier for a blockchain network. Used to prevent transaction replay attacks.

**Example**: Dogechain has chain ID 2000.

#### Consensus

The process by which nodes on a blockchain network agree on the state of the ledger.

**Example**: Proof of Work (PoW), Proof of Stake (PoS), Delegated Proof of Stake (DPoS) are consensus mechanisms.

#### Cryptographic Hash

A mathematical function that converts data of arbitrary size to a fixed-size output. Used to secure blockchain data.

**Example**: SHA-256 is a cryptographic hash function used by Bitcoin.

### D

#### Decentralization

The distribution of power and control away from a central authority. Blockchains are decentralized networks.

**Example**: No single entity controls the Bitcoin network.

#### Decentralized Application (dApp)

An application that runs on a blockchain or peer-to-peer network, rather than on a single computer.

**Example**: Uniswap, Aave, Dogepump DEX are dApps.

#### Distributed Ledger

A database that is synchronized and shared across multiple sites, institutions, or geographies.

**Example**: Blockchain is a type of distributed ledger.

#### DLT (Distributed Ledger Technology)

The technology behind distributed ledgers, including blockchain and other non-blockchain distributed ledgers.

**Example**: Blockchain, DAG (Directed Acyclic Graph) are types of DLT.

### E

#### EVM (Ethereum Virtual Machine)

See EVM in DEX Terminology.

### F

#### Fork

A split in the blockchain, resulting in two separate chains. Can be hard (incompatible) or soft (backward-compatible).

**Example**: The Ethereum/ETC split was a hard fork.

### G

#### Genesis Block

The first block in a blockchain.

**Example**: The genesis block of Bitcoin was mined on January 3, 2009.

#### Gwei

See Gwei in DEX Terminology.

### H

#### Hash

See Cryptographic Hash.

#### Hard Fork

A type of fork that is not backward-compatible, requiring all nodes to upgrade to the new protocol.

**Example**: The Ethereum London upgrade was a hard fork.

#### Hash Rate

The measure of computational power per second used when mining a cryptocurrency.

**Example**: Bitcoin's hash rate is approximately 400 EH/s.

### M

#### Mainnet

The main network where actual transactions take place, as opposed to testnet.

**Example**: The Dogechain mainnet is where real DOGE transactions occur.

#### Mining

The process of validating transactions and adding them to the blockchain. Miners are rewarded with new tokens.

**Example**: Bitcoin miners validate transactions and earn BTC rewards.

#### Miner

A participant in the blockchain network who validates transactions and adds them to the blockchain.

**Example**: Bitcoin miners use specialized hardware to mine BTC.

### N

#### Node

A computer that participates in the blockchain network, maintaining a copy of the ledger and validating transactions.

**Example**: Running a Dogechain node allows you to participate in the network.

#### Nonce

See Nonce in DEX Terminology.

### P

#### Proof of Stake (PoS)

A consensus mechanism where validators are chosen based on the amount of tokens they hold and are willing to "stake" as collateral.

**Example**: Ethereum 2.0 uses Proof of Stake.

#### Proof of Work (PoW)

A consensus mechanism where miners compete to solve complex mathematical problems to validate transactions and add blocks.

**Example**: Bitcoin uses Proof of Work.

#### Private Key

A secret number that allows a user to spend their cryptocurrency. Must be kept secure.

**Example**: Never share your private key with anyone.

#### Public Key

A cryptographic key that can be shared publicly, derived from the private key. Used to receive funds.

**Example**: Your wallet address is derived from your public key.

### R

#### RPC (Remote Procedure Call)

A protocol that allows a program to execute a procedure on another computer without needing to understand the network details.

**Example**: https://rpc.dogechain.dog is the Dogechain RPC endpoint.

### S

#### Seed Phrase

A series of words that can be used to recover a cryptocurrency wallet. Also known as a recovery phrase or mnemonic phrase.

**Example**: "correct horse battery staple correct horse battery staple correct horse battery staple correct horse battery staple" is a seed phrase.

#### Soft Fork

A type of fork that is backward-compatible, meaning nodes that don't upgrade can still validate new blocks.

**Example**: The SegWit upgrade was a soft fork.

#### Smart Contract

See Smart Contract in DEX Terminology.

### T

#### Testnet

A testing network used to develop and test blockchain applications without using real money.

**Example**: The Dogechain testnet is used for testing before deploying to mainnet.

#### Transaction

A record of value transfer on the blockchain.

**Example**: Sending 100 DC from one address to another is a transaction.

#### Transaction Fee

A fee paid to network validators for processing a transaction.

**Example**: A swap might cost $0.50 in transaction fees.

### V

#### Validator

A participant in a Proof of Stake network who validates transactions and creates new blocks.

**Example**: Ethereum 2.0 validators stake ETH to validate transactions.

---

## DeFi Terminology

### A

#### Aave

A decentralized lending protocol on Ethereum.

#### APY

See APY in DEX Terminology.

#### Arbitrage

See Arbitrage in DEX Terminology.

#### Automated Market Maker

See AMM in DEX Terminology.

### B

#### Bonding Curve

A mathematical curve that defines the relationship between the price and supply of a token.

**Example**: Bancor uses a bonding curve for its AMM.

#### Bridge

See Cross-Chain Bridge in DEX Terminology.

### C

#### CEX

See CEX in DEX Terminology.

#### Collateral

An asset pledged as security for a loan. In DeFi, users deposit collateral to borrow other assets.

**Example**: Deposit $1,000 worth of ETH as collateral to borrow $500 USDC.

#### Compound

A decentralized lending protocol on Ethereum.

#### Curve

A decentralized exchange optimized for stablecoin trading.

### D

#### DAI

A decentralized stablecoin pegged to the US dollar, created by MakerDAO.

#### dApp

See Decentralized Application in Blockchain Terminology.

#### DEX

See DEX in DEX Terminology.

#### DeFi (Decentralized Finance)

Financial services built on blockchain technology, without traditional intermediaries like banks.

**Example**: Uniswap, Aave, Compound are DeFi protocols.

### E

#### EVM

See EVM in DEX Terminology.

### F

#### Flash Loan

See Flash Loan in DEX Terminology.

#### Frictionless

A term used to describe DeFi protocols that have minimal barriers to entry and use.

**Example**: Uniswap allows anyone to provide liquidity without permission.

### G

#### Gas

See Gas in DEX Terminology.

#### Governance

The process by which decisions are made in a decentralized protocol. Often implemented through token voting.

**Example**: Uniswap token holders can vote on protocol proposals.

### I

#### Impermanent Loss

See Impermanent Loss in DEX Terminology.

#### Insurance Fund

A pool of funds used to compensate users in case of hacks or protocol failures.

**Example**: Nexus Mutual provides DeFi insurance.

### L

#### Lending Protocol

A DeFi protocol that allows users to lend and borrow assets.

**Example**: Aave, Compound are lending protocols.

#### Liquidity

See Liquidity in DEX Terminology.

#### Liquidity Mining

The process of providing liquidity to a DeFi protocol to earn rewards, typically in the form of protocol tokens.

**Example**: Provide liquidity to Uniswap and earn UNI tokens.

#### Liquidity Pool

See Liquidity Pool in DEX Terminology.

#### LP Token

See LP Token in DEX Terminology.

### M

#### MakerDAO

A decentralized organization that created the DAI stablecoin.

#### Market Maker

See Market Maker in DEX Terminology.

#### MEV

See MEV in DEX Terminology.

#### Mint

See Mint in DEX Terminology.

### N

#### NFT (Non-Fungible Token)

A unique digital asset that cannot be replicated. Unlike cryptocurrencies, each NFT is unique.

**Example**: CryptoKitties, Bored Apes are NFTs.

### O

#### Oracle

See Oracle in DEX Terminology.

#### Over-Collateralization

The practice of requiring more collateral than the value of the loan. Used to mitigate risk in DeFi lending.

**Example**: To borrow $500 USDC, you might need to deposit $1,000 worth of ETH as collateral.

### P

#### Pool

See Liquidity Pool in DEX Terminology.

#### Price Impact

See Price Impact in DEX Terminology.

#### Protocol

A set of rules and smart contracts that define a DeFi application.

**Example**: Uniswap is a protocol for decentralized trading.

### R

#### Rebalancing

The process of adjusting a portfolio to maintain desired asset allocation.

**Example**: If your portfolio is 60% ETH and 40% USDC, but ETH price rises, you might sell some ETH to rebalance to 50/50.

#### Reserve

See Reserve in DEX Terminology.

#### Router

See Router in DEX Terminology.

### S

#### Slippage

See Slippage in DEX Terminology.

#### Smart Contract

See Smart Contract in DEX Terminology.

#### Stablecoin

A cryptocurrency pegged to a stable asset like the US dollar.

**Example**: USDC, DAI, USDT are stablecoins.

#### Staking

See Staking in DEX Terminology.

#### Swap

See Swap in DEX Terminology.

### T

#### TVL

See TVL in DEX Terminology.

#### TWAP

See TWAP in DEX Terminology.

#### Token

See Token in DEX Terminology.

#### Tokenomics

The study of the economic model of a cryptocurrency or token.

**Example**: Tokenomics includes supply, distribution, utility, and incentives.

### U

#### Uniswap

A decentralized exchange on Ethereum using the AMM model.

#### Under-Collateralization

The practice of requiring less collateral than the value of the loan. Rare in DeFi due to high risk.

**Example**: Some flash loan protocols allow under-collateralized borrowing.

### V

#### Vault

A smart contract that manages user deposits and strategies to maximize returns.

**Example**: Yearn.finance vaults automatically allocate funds to the best yielding strategies.

#### Volatility

See Volatility in DEX Terminology.

### Y

#### Yield Farming

The practice of staking or lending crypto assets to generate high returns or rewards.

**Example**: Provide liquidity to a pool and earn trading fees + token rewards.

#### Yearn.finance

A DeFi protocol that automatically moves funds between lending protocols to maximize yield.

---

## Acronyms and Abbreviations

### Blockchain & Crypto

- **BTC**: Bitcoin
- **ETH**: Ethereum
- **DOGE**: Dogecoin
- **USDC**: USD Coin
- **USDT**: Tether
- **DAI**: DAI stablecoin
- **NFT**: Non-Fungible Token
- **HODL**: Hold On for Dear Life (slang for holding cryptocurrency)
- **FOMO**: Fear Of Missing Out
- **FUD**: Fear, Uncertainty, and Doubt

### DeFi & DEX

- **AMM**: Automated Market Maker
- **APY**: Annual Percentage Yield
- **APR**: Annual Percentage Rate
- **CEX**: Centralized Exchange
- **DEX**: Decentralized Exchange
- **TVL**: Total Value Locked
- **LP**: Liquidity Provider
- **LP Token**: Liquidity Provider Token
- **MEV**: Maximal Extractable Value
- **TWAP**: Time-Weighted Average Price
- **IL**: Impermanent Loss

### Technical

- **EVM**: Ethereum Virtual Machine
- **RPC**: Remote Procedure Call
- **API**: Application Programming Interface
- **UI**: User Interface
- **UX**: User Experience
- **dApp**: Decentralized Application
- **DAO**: Decentralized Autonomous Organization
- **PoW**: Proof of Work
- **PoS**: Proof of Stake
- **DPoS**: Delegated Proof of Stake
- **DLT**: Distributed Ledger Technology

### Development

- **ERC**: Ethereum Request for Comment
  - **ERC-20**: Fungible token standard
  - **ERC-721**: Non-fungible token standard
  - **ERC-1155**: Multi-token standard
- **ABI**: Application Binary Interface
- **IPFS**: InterPlanetary File System
- **CID**: Content Identifier
- **DID**: Decentralized Identifier

### Gas & Transactions

- **Gwei**: Gigawei (unit of gas)
- **Wei**: Smallest unit of ETH (10^-18 ETH)
- **Szabo**: Unit of ETH (10^-12 ETH)
- **Finney**: Unit of ETH (10^-15 ETH)
- **TxD**: Transaction
- **TxHash**: Transaction Hash

### Security

- **2FA**: Two-Factor Authentication
- **MFA**: Multi-Factor Authentication
- **KYC**: Know Your Customer
- **AML**: Anti-Money Laundering
- **CDD**: Customer Due Diligence
- **SOC**: Security Operations Center

### Development & Testing

- **CI/CD**: Continuous Integration/Continuous Deployment
- **TDD**: Test-Driven Development
- **BDD**: Behavior-Driven Development
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It

### Dogepump DEX Specific

- **DC**: Dogecoin (native token)
- **wDOGE**: Wrapped DOGE
- **DogePumpFactory**: Factory contract for creating pools
- **DogePumpPair**: Pair contract for individual pools
- **DogePumpRouter**: Router contract for swaps and liquidity operations
- **DogePumpLPToken**: LP token contract
- **GraduationManager**: Contract for managing token graduation

---

## Additional Resources

- [User Guide](./DEX_USER_GUIDE.md)
- [Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- [Architecture Documentation](./DEX_ARCHITECTURE.md)
- [Security Guide](./DEX_SECURITY_GUIDE.md)
- [Troubleshooting Guide](./DEX_TROUBLESHOOTING.md)

---

**Last Updated:** December 30, 2025
