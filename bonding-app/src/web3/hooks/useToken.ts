import { useReadContract, useWriteContract } from 'wagmi';
import { Address, parseEther, maxUint256 } from 'viem';
import { getBondingCurveAddressABI, getReserveAddressABI } from '../client';

const { address: BONDING_CURVE_ADDRESS, abi: BONDING_CURVE_ABI } = getBondingCurveAddressABI();
const { address: RESERVE_TOKEN_ADDRESS, abi: RESERVE_ABI } = getReserveAddressABI()

console.log('Bonding Curve Address:', BONDING_CURVE_ADDRESS)
console.log('Reserve Token Address:', RESERVE_TOKEN_ADDRESS)

export function useBuyToken(tokenAddress: string, quantity: string) {
  const { data: hash, isPending, writeContract, isSuccess, isError, error } = useWriteContract()

  const buyTokens = () => {
    if (!quantity || !tokenAddress) return
    try {
      writeContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'buy',
        args: [tokenAddress, BigInt(quantity)],
      })
    } catch (e) {
      console.error('Error parsing the quantity:', e)
    }
  }

  return { hash, isPending, buyTokens, isError, error, isSuccess }
}

export function useSellToken(tokenAddress: string, quantity: string) {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract()

  const sellTokens = () => {
    if (!quantity || !tokenAddress) return
    try {
      writeContract({
      address: BONDING_CURVE_ADDRESS,
      abi: BONDING_CURVE_ABI,
      functionName: 'sell',
      args: [tokenAddress, BigInt(quantity || '0')],
    })
    } catch (e) {
      console.error('Error parsing the quantity:', e)
    }
  }
  return { hash, isPending, sellTokens, isError, error }
}

export function useReserveTokenBalance(address: string | undefined) {
  return useReadContract({
    address: RESERVE_TOKEN_ADDRESS,
    abi: RESERVE_ABI,
    functionName: 'balanceOf',
    args: [address]
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
}

export function useApproveReserveToken(amount: string) {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract()

  const approveTokens = () => {
    writeContract({
      address: RESERVE_TOKEN_ADDRESS,
      abi: RESERVE_ABI,
      functionName: 'approve',
      args: [BONDING_CURVE_ADDRESS, maxUint256], // parseEther(amount || '0')], // maxUint256], // Approve maximum amount
    })
  }

  return { hash, isPending, approveTokens, isError, error }
}

export function useReserveTokenAllowance(address: string | undefined) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: RESERVE_TOKEN_ADDRESS,
    abi: RESERVE_ABI,
    functionName: 'allowance',
    args: address ? [address, BONDING_CURVE_ADDRESS] : undefined
  })

  return { 
    data: data as bigint | undefined,
    isLoading,
    isError,
    refetch
  }
}

export function useGetCost(tokenAddress: string, quantity: string) {
  return useReadContract({
    address: BONDING_CURVE_ADDRESS,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCost',
    args: quantity ? [tokenAddress, BigInt(quantity)] : undefined
  })
}

// export function useApproveToken(tokenAddress: Address, amount: string) {
//   const { data: hash, isPending, writeContract, isError, error } = useWriteContract()

//   const approveTokens = () => {
//     writeContract({
//       address: tokenAddress,
//       abi: RESERVE_ABI,
//       functionName: 'approve',
//       args: [BONDING_CURVE_ADDRESS, parseEther(amount || '0')],
//     })
//   }

//   return { hash, isPending, approveTokens, isError, error }
// }

export function useTokenBalance(tokenAddress: Address, address: string | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: RESERVE_ABI,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
}

// export function useTokenAllowance(tokenAddress: Address, address: string | undefined) {
//   return useReadContract({
//     address: tokenAddress,
//     abi: RESERVE_ABI,
//     functionName: 'allowance',
//     args: [address, BONDING_CURVE_ADDRESS],
//   }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
// }

