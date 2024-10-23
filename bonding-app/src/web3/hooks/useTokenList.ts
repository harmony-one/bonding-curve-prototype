import { useReadContract } from 'wagmi'
import { getBondingCurveAddressABI } from '../client'
import { Address, ReadContractErrorType } from 'viem';


export type TokenInfo = {
  name: string;
  symbol: string;
  tokenAddress: Address; // `0x${string}`;
  currentPrice: bigint;
  totalSupply: bigint;
};

export function useTokenList() {

  const { address, abi } = getBondingCurveAddressABI()

  return useReadContract({
    address,
    abi,
    functionName: 'getTokenListWithPrice',
  }) as { data: TokenInfo[] | undefined; isLoading: boolean; isError: boolean; error: ReadContractErrorType, refetch: () => void }
}