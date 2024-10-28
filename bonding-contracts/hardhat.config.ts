/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-solhint';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import 'dotenv/config';
import 'hardhat-deploy';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'hardhat-abi-exporter';
import { HardhatUserConfig } from 'hardhat/config';
import * as configApp from './config'
import * as path from 'path';

const networkFolder = configApp.config.network || 'default';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'testnet',
  networks: {
    'mainnet': {
      url: configApp.config.chains.mainnet.networkUrl,
      chainId: configApp.config.chains.mainnet.chainId,
      accounts: [configApp.config.chains.mainnet.privateKey],
    },
    'testnet': {
      url: configApp.config.chains.testnet.networkUrl, 
      chainId: configApp.config.chains.testnet.chainId,
      accounts: [configApp.config.chains.testnet.privateKey],
    },
    'localhost': {
      url: "http://127.0.0.1:8545",
      chainId: 1337, // 31337,
    },
    'hardhat': {
      chainId: 1337, //31337,
      // accounts: [configApp.config.hardhat.privateKey]
    }
  },
  namedAccounts: {
    deployer: {
      default: 0, // Use the first account from the accounts array
      mainnet: 0,
      testnet: 0,
      harmony: 0,
    },
  },
  contractSizer: {
    runOnCompile: true,
  },
  abiExporter: {
    path: path.join(__dirname, 'abis', networkFolder), // './abis',
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
  },
  // gasReporter: {
  //   onlyCalledMethods: true,
  //   showTimeSpent: true,
  // },
  mocha: {
    timeout: 1000000000,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: path.join(__dirname, 'cache', networkFolder),
    artifacts: path.join(__dirname, 'artifacts', networkFolder),
    deploy:'./scripts/deploy'
  },
};

export default config;
