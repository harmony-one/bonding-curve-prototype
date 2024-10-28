import { createPublicClient, http, Chain, PublicClient, Address, getContract, Abi } from 'viem'
import { hardhat, harmonyOne, localhost } from 'viem/chains'
import { create } from 'zustand'
import { harmonyTestnet } from './chains'
import config from '@/config'
import BondingCurveABI from '../web3/abi/BondingCurve.json'
import Erc20ABI from '../web3/abi/ERC20.json'

// Define supported chains
export const supportedChains = [harmonyTestnet, harmonyOne, hardhat, localhost]

// Create a store to manage the current chain
interface ChainStore {
  currentChain: Chain
  setCurrentChain: (chain: Chain) => void
}

export const useChainStore = create<ChainStore>((set) => ({
  currentChain: harmonyTestnet, // Default to mainnet
  setCurrentChain: (chain) => set({ currentChain: chain }),
}))

// Function to get the client for the current chain
export function useClient(): PublicClient {
  const { currentChain } = useChainStore()
  return createPublicClient({
    chain: currentChain,
    transport: http(),
  })
}

// Helper function to check if a chain is supported
export function isSupportedChain(chainId: number): boolean {
  return supportedChains.some(chain => chain.id === chainId)
}

export function getBondingCurveAddressABI(): { address: Address, abi: Abi } {
  return {
    address: config.bondingCurveContractAddress,
    abi: BondingCurveABI as Abi
  }
}

export function getBondingCurveABI() {
  return BondingCurveABI
}

export function getReserveAddressABI(): { address: Address, abi: Abi }  {
  return {
    address: config.reserveTokenAddress,
    abi: Erc20ABI as Abi
  }
}

export function getBondingCurveContract() {
  const client = useClient()
  const address = config.bondingCurveContractAddress
  return getContract({
    address,
    abi: BondingCurveABI,
    client,
  })
}
