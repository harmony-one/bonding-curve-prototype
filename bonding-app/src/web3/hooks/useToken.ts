import { useReadContract, useWriteContract } from 'wagmi';
import { Address, parseEther, maxUint256 } from 'viem';
import { getBondingCurveAddressABI, getReserveAddressABI } from '../client';
import { useMemo } from 'react';

const { address: BONDING_CURVE_ADDRESS, abi: BONDING_CURVE_ABI } = getBondingCurveAddressABI();
const { address: RESERVE_TOKEN_ADDRESS, abi: RESERVE_ABI } = getReserveAddressABI()

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
  const { data: hash, isPending, writeContract, isError, error, isSuccess } = useWriteContract()

  const sellTokens = () => {
    if (!quantity || !tokenAddress) return
    try {
      const quantityBigInt = BigInt(quantity)
      writeContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'sell',
        args: [tokenAddress, quantityBigInt]
      })
    } catch (e) {
      console.error('Error selling tokens:', e)
    }
  }
  
  return { hash, isPending, sellTokens, isError, error, isSuccess }
}

export function useReserveTokenBalance(address: string | undefined) {
  return useReadContract({
    address: RESERVE_TOKEN_ADDRESS,
    abi: RESERVE_ABI,
    functionName: 'balanceOf',
    args: [address]
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
}

// for buy operation
export function useApproveReserveToken(amount: string) {
  const { data: hash, isPending, writeContract, isError, error, isSuccess } = useWriteContract()

  const approveToken = () => {
    writeContract({
      address: RESERVE_TOKEN_ADDRESS,
      abi: RESERVE_ABI,
      functionName: 'approve',
      args: [BONDING_CURVE_ADDRESS, maxUint256], // parseEther(amount || '0')], // maxUint256], // Approve maximum amount
    })
  }

  return { hash, isPending, approveToken, isError, error, isSuccess }
}

// for sell operation
export function useApproveToken(tokenAddress: Address, amount: string) {
  const { data: hash, isPending, writeContract, isError, error, isSuccess } =  useWriteContract()

  const approveToken = () => {
    if (!amount) return
    try {
      writeContract({
        address: tokenAddress,
        abi: RESERVE_ABI, // We can use the same ABI since approve is standard ERC20
        functionName: 'approve',
        args: [BONDING_CURVE_ADDRESS, BigInt(amount)],
      })
    } catch (e) {
      console.error('Error approving token:', e)
    }
  }
  
  return { hash, isPending, approveToken, isError, error, isSuccess }
}

// for sell operation
export function useTokenAllowance(tokenAddress: Address, walletAddress: string | undefined) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: tokenAddress,
    abi: RESERVE_ABI,
    functionName: 'allowance',
    args: walletAddress ? [walletAddress, BONDING_CURVE_ADDRESS] : undefined,
  })
  
  return { 
    data: data as bigint | undefined,
    isLoading,
    isError,
    refetch
  }
}


// for buy operation
export function useReserveTokenAllowance(walletAddress: string | undefined) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: RESERVE_TOKEN_ADDRESS,
    abi: RESERVE_ABI,
    functionName: 'allowance',
    args: walletAddress ? [walletAddress, BONDING_CURVE_ADDRESS] : undefined
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

export function useGetRefund(tokenAddress: string, quantity: string) {
  const args = useMemo(() => {
    if (!quantity || !tokenAddress) return undefined
    try {
      return [tokenAddress as Address, BigInt(quantity)] as const
    } catch (e) {
      console.error('Error formatting getRefund args:', e)
      return undefined
    }
  }, [tokenAddress, quantity])

  return useReadContract({
    address: BONDING_CURVE_ADDRESS,
    abi: BONDING_CURVE_ABI,
    functionName: 'getRefund',
    args,
    // enabled: args !== undefined
  })
}

export function useTokenBalance(tokenAddress: Address, address: string | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: RESERVE_ABI,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint | undefined; isLoading: boolean; isError: boolean; refetch: () => void }
}
