import { useState, useCallback, useEffect } from 'react'
import { useTokenBalance, useReserveTokenBalance } from '@/web3/hooks/useToken'
import { useAccount } from 'wagmi'
import { Address } from 'viem'

export const useBalanceUpdate = (tokenAddress: Address) => {
  const { address } = useAccount()
  const [updateTrigger, setUpdateTrigger] = useState(0)
  
  const { 
    data: balance, 
    isLoading,
    refetch: refetchBalance
  } = useTokenBalance(tokenAddress, address)
  
  const {
    data: reserveBalance,
    refetch: refetchReserveBalance
  } = useReserveTokenBalance(address)

  const triggerUpdate = useCallback(async () => {
    // Increment trigger to force re-render
    setUpdateTrigger(prev => prev + 1)
    
    // Wait a bit for blockchain state to update
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Refetch both balances
    const [tokenBalance, oneBalance] = await Promise.all([
      refetchBalance(),
      refetchReserveBalance()
    ])
    
    return { tokenBalance, oneBalance }
  }, [refetchBalance, refetchReserveBalance])

  // Auto refresh on interval
  useEffect(() => {
    const interval = setInterval(async () => {
      await triggerUpdate()
    }, 10000)

    return () => clearInterval(interval)
  }, [triggerUpdate])

  return {
    balance,
    reserveBalance,
    isLoading,
    triggerUpdate
  }
}