import { defineChain } from 'viem'

export const harmonyTestnet = defineChain({
  id: 1666700000,
  name: 'Harmony Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ONE',
    symbol: 'ONE',
  },
  rpcUrls: {
    default: {
      http: ['https://api.s0.b.hmny.io'],
      webSocket: ['wss://ws.s0.b.hmny.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Harmony Testnet Explorer', url: 'https://explorer.testnet.harmony.one/' },
  },
  testnet: true
})

export const hardhat = defineChain({
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  }
})

export const localhost = defineChain({
  id: 1337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  }
})