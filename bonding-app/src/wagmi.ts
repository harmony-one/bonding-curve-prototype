import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { hardhat, harmonyOne, localhost } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { harmonyTestnet } from './web3/chains'

export function getConfig() {
  return createConfig({
    chains: [harmonyOne, harmonyTestnet, hardhat, localhost],
    connectors: [
      injected(),
      // coinbaseWallet(),
     // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? ''}),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    // client
    // defaultChainId: harmonyTestnet.id,
    transports: {
      [harmonyOne.id]: http(),
      [harmonyTestnet.id]: http(),
      [hardhat.id]: http('http://127.0.0.1:8545', {
        batch: false,
        timeout: 10000,
      }),
      [localhost.id]: http('http://127.0.0.1:8545', {
        batch: false,
        timeout: 10000,
      }),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
