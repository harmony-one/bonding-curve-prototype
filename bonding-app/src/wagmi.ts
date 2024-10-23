import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { harmonyOne, localhost } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { harmonyTestnet } from './web3/chains'

export function getConfig() {
  return createConfig({
    chains: [harmonyOne, harmonyTestnet, localhost],
    connectors: [
      injected(),
      // coinbaseWallet(),
     // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? ''}),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [harmonyOne.id]: http(),
      [harmonyTestnet.id]: http(),
      [localhost.id]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
