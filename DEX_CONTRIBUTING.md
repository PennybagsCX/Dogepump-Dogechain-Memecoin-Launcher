# DEX Contributing Guide

Complete contributing guide for Dogepump DEX.

## Table of Contents

- [How to Contribute](#how-to-contribute)
- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Code Review Process](#code-review-process)
- [Release Process](#release-process)

---

## How to Contribute

### Ways to Contribute

We welcome contributions from everyone! Here are ways you can help:

#### Code Contributions

- **Bug Fixes**: Fix bugs reported in issues
- **New Features**: Add new features or improvements
- **Documentation**: Improve documentation
- **Tests**: Add or improve tests
- **Performance**: Optimize code for better performance
- **Security**: Improve security measures

#### Non-Code Contributions

- **Bug Reports**: Report bugs you encounter
- **Feature Requests**: Suggest new features
- **Documentation**: Improve existing documentation
- **Translations**: Help translate the interface
- **Community**: Help other users on Discord
- **Testing**: Test pre-release versions
- **Design**: Improve UI/UX design

### Getting Started

1. **Read This Guide**
   - Understand contribution guidelines
   - Review code of conduct
   - Learn the development workflow

2. **Choose an Issue**
   - Look for issues labeled `good first issue`
   - Check issues labeled `help wanted`
   - Create a new issue if needed

3. **Set Up Development Environment**
   - Follow [Development Setup](#development-setup)
   - Install dependencies
   - Run tests to verify setup

4. **Make Your Changes**
   - Create a feature branch
   - Make your changes
   - Test thoroughly
   - Commit with clear messages

5. **Submit Pull Request**
   - Follow [Pull Request Process](#pull-request-process)
   - Provide clear description
   - Link related issues
   - Address feedback

### Contribution Guidelines

#### Before You Start

- **Check for duplicates**: Search existing issues before creating new ones
- **Discuss first**: For major changes, discuss in an issue first
- **Start small**: Start with small contributions to get familiar
- **Ask questions**: If unsure, ask in Discord or create an issue

#### While Contributing

- **Follow conventions**: Follow existing code style and conventions
- **Write tests**: Write tests for new functionality
- **Update docs**: Update relevant documentation
- **Be patient**: Code review takes time

#### After Contributing

- **Respond to feedback**: Address reviewer comments
- **Update your PR**: Make requested changes
- **Stay engaged**: Follow your PR through to completion

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:

- Age
- Body size
- Disability
- Ethnicity
- Gender identity and expression
- Level of experience
- Nationality
- Personal appearance
- Race
- Religion
- Sexual identity and orientation

### Our Standards

#### Positive Behavior

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

#### Unacceptable Behavior

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other unethical or unprofessional conduct

### Responsibilities

Project maintainers are responsible for:

- Clarifying the standards of acceptable behavior
- Taking appropriate and fair corrective action
- Responding to any complaints or concerns

Project contributors are responsible for:

- Following this code of conduct
- Reporting unacceptable behavior to maintainers
- Helping create a positive environment

### Reporting Issues

If you experience or witness unacceptable behavior:

1. **Contact Maintainers**
   - Email: conduct@dogepump.com
   - Discord: DM any maintainer

2. **Provide Details**
   - What happened
   - When it happened
   - Who was involved
   - Any witnesses

3. **Confidentiality**
   - Reports will be kept confidential
   - We will investigate thoroughly
   - We will take appropriate action

### Enforcement

Project maintainers may:

- Remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions
- Temporarily or permanently ban any contributor for behavior they deem inappropriate, threatening, offensive, or harmful

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1.

---

## Development Setup

### Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended)
- **Browser**: Chrome, Firefox, or Edge

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/dogepump/dex.git
cd dex
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=2000
NEXT_PUBLIC_CHAIN_NAME=Dogechain
NEXT_PUBLIC_RPC_URL=https://rpc.dogechain.dog
NEXT_PUBLIC_EXPLORER_URL=https://explorer.dogechain.dog

# Contract Addresses (Update after deployment)
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_DC_TOKEN_ADDRESS=0x...

# API Configuration
NEXT_PUBLIC_API_URL=https://api.dogepump.com
API_SECRET_KEY=your-secret-key

# Feature Flags
NEXT_PUBLIC_ENABLE_TESTNET=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

#### 4. Start Development Server

```bash
npm run dev
```

The development server will start at `http://localhost:3000`

### Development Workflow

#### 1. Create a Branch

```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-fix

# Or for documentation
git checkout -b docs/your-doc-update
```

#### 2. Make Changes

- Write your code following the project conventions
- Add tests for new functionality
- Update documentation as needed
- Run tests locally

#### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Build the project
npm run build
```

#### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "feat: add new swap feature"

# Or for bug fixes
git commit -m "fix: resolve transaction stuck issue"
```

#### 5. Push to GitHub

```bash
git push origin feature/your-feature-name
```

### Branch Naming Conventions

Use these prefixes for branch names:

- `feature/`: New features
- `fix/`: Bug fixes
- `docs/`: Documentation changes
- `refactor/`: Code refactoring
- `test/`: Test additions or changes
- `chore/`: Maintenance tasks

### Commit Message Conventions

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

#### Examples

```
feat(swap): add multi-hop swap support

Implement multi-hop swaps through DC token for better
liquidity and pricing.

Closes #123
```

```
fix(router): resolve transaction stuck on pending

Fixed nonce management issue that caused transactions
to get stuck in pending state.

Fixes #456
```

### Code Style

#### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use explicit types
- Avoid `any` type

```typescript
// ✅ Good
interface SwapParams {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  slippage: number;
  deadline: number;
}

async function swapTokens(params: SwapParams): Promise<SwapResult> {
  // Implementation
}

// ❌ Bad
async function swapTokens(params: any): Promise<any> {
  // Implementation
}
```

#### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Use proper TypeScript types

```typescript
// ✅ Good
interface DexSwapProps {
  tokens: Token[];
  onSwap: (params: SwapParams) => void;
}

export const DexSwap: React.FC<DexSwapProps> = ({ tokens, onSwap }) => {
  const [amount, setAmount] = useState<string>('');
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

// ❌ Bad
export default function DexSwap(props: any) {
  const [amount, setAmount] = useState('');
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### Smart Contracts

- Use Solidity 0.8.x
- Use OpenZeppelin contracts
- Follow checks-effects-interactions pattern
- Use NatSpec documentation

```solidity
// ✅ Good
/// @notice Swap tokens in the pool
/// @param amount0Out Amount of token0 to receive
/// @param amount1Out Amount of token1 to receive
/// @param to Recipient address
/// @param data Additional data for callbacks
function swap(
    uint amount0Out,
    uint amount1Out,
    address to,
    bytes calldata data
) external nonReentrant whenNotPaused {
    // Implementation
}

// ❌ Bad
function swap(uint a, uint b, address c, bytes calldata d) external {
    // Implementation
}
```

### Testing

#### Unit Tests

Write unit tests for all new functionality:

```typescript
describe('ContractService', () => {
  describe('swapTokens', () => {
    it('should swap tokens successfully', async () => {
      const service = new ContractService(provider, signer);
      const result = await service.swapTokens(params);
      
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });
    
    it('should throw error on invalid params', async () => {
      const service = new ContractService(provider, signer);
      
      await expect(
        service.swapTokens(invalidParams)
      ).rejects.toThrow('Invalid parameters');
    });
  });
});
```

#### Integration Tests

Write integration tests for complex flows:

```typescript
describe('Swap Flow', () => {
  it('should complete swap flow', async () => {
    // 1. Connect wallet
    await connectWallet();
    
    // 2. Select tokens
    await selectToken(tokenA);
    await selectToken(tokenB);
    
    // 3. Enter amount
    await enterAmount('100');
    
    // 4. Execute swap
    const result = await executeSwap();
    
    // 5. Verify
    expect(result.success).toBe(true);
  });
});
```

### Documentation

Update documentation for all changes:

- **API Changes**: Update [API Reference](./DEX_API_REFERENCE.md)
- **New Features**: Update [User Guide](./DEX_USER_GUIDE.md)
- **Developer Changes**: Update [Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- **Contract Changes**: Update [Contract Documentation](./contracts/CONTRACT_DOCUMENTATION.md)

---

## Pull Request Process

### Creating a Pull Request

#### 1. Prepare Your PR

Before creating a PR, ensure:

- **Tests Pass**: All tests pass locally
- **Linting Passes**: Code passes linting
- **Build Succeeds**: Project builds successfully
- **Documentation Updated**: Relevant docs are updated
- **Commits Clean**: Commit messages follow conventions

#### 2. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Click "Create pull request"

#### 3. Fill PR Template

Use the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Related to #456

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] No new warnings
```

### PR Review Process

#### 1. Automated Checks

Your PR will automatically run:

- **CI Tests**: All tests must pass
- **Linting**: Code must pass linting
- **Build**: Project must build successfully
- **Security**: Security checks must pass

#### 2. Code Review

Maintainers will review your code:

- **Code Quality**: Code follows conventions
- **Best Practices**: Uses best practices
- **Security**: No security issues
- **Performance**: No performance issues
- **Documentation**: Documentation is updated

#### 3. Feedback

Reviewers may request changes:

- **Address Feedback**: Make requested changes
- **Discuss**: If you disagree, discuss respectfully
- **Update PR**: Push changes to your branch

#### 4. Approval

Your PR needs:

- **At Least One Approval**: From a maintainer
- **All Checks Pass**: Automated checks must pass
- **No Conflicts**: Must merge cleanly

### Merging

#### When to Merge

Your PR will be merged when:

- All reviewers approve
- All checks pass
- No merge conflicts
- Documentation is complete

#### Merge Methods

We use:

- **Squash and Merge**: For feature branches
- **Rebase and Merge**: For hotfixes
- **Merge Commit**: For release branches

#### After Merge

- **Delete Branch**: Delete your feature branch
- **Update Local**: Pull latest changes
- **Celebrate**: Celebrate your contribution!

---

## Code Review Process

### Review Guidelines

#### For Reviewers

When reviewing code:

1. **Be Constructive**
   - Provide helpful feedback
   - Suggest improvements
   - Explain your reasoning

2. **Be Respectful**
   - Be polite and professional
   - Assume good intentions
   - Focus on code, not person

3. **Be Thorough**
   - Review all changes
   - Check for edge cases
   - Verify tests

4. **Be Timely**
   - Review promptly
   - Respond to questions
   - Follow up on discussions

#### For Contributors

When receiving reviews:

1. **Be Open**
   - Accept feedback gracefully
   - Consider suggestions
   - Learn from feedback

2. **Ask Questions**
   - If unsure, ask for clarification
   - Discuss alternative approaches
   - Seek understanding

3. **Respond Promptly**
   - Address feedback quickly
   - Update your PR
   - Keep the conversation going

### Review Checklist

#### Code Quality

- [ ] Code follows project conventions
- [ ] Code is readable and maintainable
- [ ] Code is well-structured
- [ ] Code is efficient

#### Functionality

- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Tests are comprehensive

#### Security

- [ ] No security vulnerabilities
- [ ] Input validation is present
- [ ] Access control is correct
- [ ] Sensitive data is protected

#### Performance

- [ ] Code is performant
- [ ] No unnecessary computations
- [ ] Efficient algorithms
- [ ] Proper caching

#### Documentation

- [ ] Code is well-documented
- [ ] API documentation is updated
- [ ] User documentation is updated
- [ ] Examples are provided

### Common Review Comments

#### "Consider using X instead of Y"

This means the reviewer suggests an alternative approach. You can:

- Accept the suggestion
- Discuss why you prefer your approach
- Find a compromise

#### "Can you add tests for this?"

The reviewer wants more test coverage. You should:

- Add unit tests for new code
- Add integration tests for flows
- Ensure edge cases are covered

#### "Can you explain why you did X?"

The reviewer wants to understand your reasoning. You should:

- Explain your thought process
- Provide context
- Reference relevant issues or discussions

#### "This looks good, just one small thing"

The reviewer is mostly happy. You should:

- Make the small change
- Update your PR
- Request re-review

---

## Release Process

### Versioning

We follow semantic versioning (SemVer):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

### Release Types

#### Major Release

- Breaking changes
- Major new features
- Significant architecture changes

Example: `v2.0.0`

#### Minor Release

- New features
- Improvements
- Non-breaking changes

Example: `v1.3.0`

#### Patch Release

- Bug fixes
- Security updates
- Small improvements

Example: `v1.2.1`

### Release Process

#### 1. Prepare Release

- **Update Version**: Update version in package.json
- **Update Changelog**: Document all changes
- **Update Documentation**: Update relevant docs
- **Tag Release**: Create git tag

#### 2. Test Release

- **Run Tests**: Ensure all tests pass
- **Manual Testing**: Test all features
- **Security Audit**: Run security checks
- **Performance Test**: Verify performance

#### 3. Deploy Release

- **Deploy Contracts**: Deploy smart contracts (if needed)
- **Deploy Frontend**: Deploy frontend to production
- **Update Config**: Update configuration
- **Verify Deployment**: Verify everything works

#### 4. Announce Release

- **GitHub Release**: Create GitHub release
- **Changelog**: Publish changelog
- **Announcement**: Announce on Discord/Twitter
- **Email**: Send email to users

### Release Checklist

#### Pre-Release

- [ ] All PRs merged
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version updated

#### Release

- [ ] Tag created
- [ ] GitHub release created
- [ ] Contracts deployed (if needed)
- [ ] Frontend deployed
- [ ] Configuration updated

#### Post-Release

- [ ] Announcement sent
- [ ] Users notified
- [ ] Issues monitored
- [ ] Feedback collected

### Hotfix Process

For urgent fixes:

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/v1.2.1
   ```

2. **Make Fix**
   - Fix the issue
   - Add tests
   - Update docs

3. **Test Thoroughly**
   - Run all tests
   - Manual testing
   - Security check

4. **Merge and Release**
   - Merge to main
   - Create release tag
   - Deploy immediately

5. **Backport**
   - Merge fix to other branches
   - Create patch releases

---

## Additional Resources

### Documentation

- [User Guide](./DEX_USER_GUIDE.md)
- [Developer Guide](./DEX_DEVELOPER_GUIDE.md)
- [API Reference](./DEX_API_REFERENCE.md)
- [Testing Guide](./DEX_TESTING_GUIDE.md)
- [Security Guide](./DEX_SECURITY_GUIDE.md)

### Tools

- [GitHub](https://github.com/dogepump/dex)
- [Discord](https://discord.gg/dogepump)
- [Twitter/X](https://twitter.com/dogepump)

### Standards

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Contributor Covenant](https://www.contributor-covenant.org/)

---

## Questions?

If you have questions about contributing:

1. **Check Documentation**: Review existing documentation
2. **Search Issues**: Look for similar issues
3. **Ask on Discord**: Join our Discord server
4. **Create Issue**: Create a new issue with your question

---

**Thank you for contributing to Dogepump DEX!** 🚀

---

**Last Updated:** December 30, 2025
