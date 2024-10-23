import { useReadContract } from 'wagmi'
import { getBondingCurveAddressABI } from '../client'
import { Address } from 'viem'

export function useTokenPrice(tokenAddress: Address) {
  const { address, abi } = getBondingCurveAddressABI()
  
  return useReadContract({
    address,
    abi,
    functionName: 'getCurrentPrice',
    args: [tokenAddress],
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
}