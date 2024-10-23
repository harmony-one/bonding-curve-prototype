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
