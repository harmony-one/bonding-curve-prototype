import React, { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  useTokenAllowance,
  useApproveToken,
  useSellToken,
  useTokenBalance,
  useReserveTokenBalance,
  useGetRefund
} from '@/web3/hooks/useToken'
import { useBalanceUpdate } from '@/web3/hooks/useBalanceUpdate'
import { TokenButtonProps } from './types'

const SellButton: React.FC<TokenButtonProps> = ({ token, quantity, onStatusChange, onQuantityChange  }) => {
  const { address } = useAccount()
  const { data: tokenAllowance, refetch: refetchTokenAllowance } = useTokenAllowance(token.tokenAddress, address)
  const { data: tokenBalance, refetch: refetchTokenBalance } = useTokenBalance(token.tokenAddress, address)
  const { data: reserveBalance, refetch: refetchReserveBalance } = useReserveTokenBalance(address)
  const { data: refund, error: refundError } = useGetRefund(token.tokenAddress, quantity)
  const { triggerUpdate } = useBalanceUpdate(token.tokenAddress)

  const { 
    approveToken, 
    isPending: isTokenApproving,
    isSuccess: isTokenApproveSuccess 
  } = useApproveToken(token.tokenAddress, quantity)
  
  const { 
    sellTokens, 
    isPending: isSelling,
    isSuccess: isSellSuccess 
  } = useSellToken(token.tokenAddress, quantity)

  const needsTokenApproval = (() => {
    if (!quantity || !tokenAllowance) return false
    return BigInt(quantity) > (tokenAllowance as bigint)
  })()

  useEffect(() => {
    const executeSellAfterApproval = async () => {
      if (isTokenApproveSuccess && quantity) {
        await refetchTokenAllowance()
        onStatusChange({ type: 'pending', message: 'Selling tokens...', action: 'sell' })
        try {
          await sellTokens()
        } catch (e) {
          onStatusChange({ 
            type: 'error', 
            error: e as Error,
            action: 'sell'
          })
        }
      }
    }
    executeSellAfterApproval()
  }, [isTokenApproveSuccess])

  useEffect(() => {
    const updateBalances = async () => {
      if (isSellSuccess) {
        onStatusChange({ type: 'pending', message: 'Updating balances...', action: 'sell' })
        await Promise.all([
          refetchTokenBalance(),
          refetchReserveBalance(),
          refetchTokenAllowance(),
          triggerUpdate(),
        ])
        onStatusChange({ type: 'success', message: 'Transaction successful!', action: 'sell' })
        onQuantityChange('')
      }
    }
    updateBalances()
  }, [isSellSuccess])

  const canSell = (() => {
    if (!quantity || !tokenBalance) return false
    try {
      return tokenBalance >= BigInt(quantity)
    } catch (e) {
      console.error('Error in canSell:', e)
      return false
    }
  })()

  useEffect(() => {
    if (isSellSuccess) {
      const refreshData = async () => {
        onStatusChange({ type: 'pending', message: 'Updating balances...', action: 'sell' })
        await Promise.all([
          refetchTokenBalance(),
          refetchReserveBalance(),
          refetchTokenAllowance()
        ])
        onStatusChange({ type: 'success', message: 'Transaction successful!', action: 'sell' })
        onQuantityChange('')
      }
      refreshData()
    }
  }, [isSellSuccess])

  useEffect(() => {
    if (isTokenApproveSuccess) {
      const refreshApproval = async () => {
        await refetchTokenAllowance()
        onStatusChange({ type: 'success', message: 'Approval successful!', action: 'approve' })
      }
      refreshApproval()
    }
  }, [isTokenApproveSuccess])

  const handleSell = async () => {
    if (!quantity || !canSell) return
    try {
      if (needsTokenApproval) {
        onStatusChange({ type: 'pending', message: `Approving ${token.symbol}...`, action: 'approve' })
        await approveToken()
        return
      }
      if (!refund) {
        onStatusChange({ 
          type: 'error', 
          error: new Error('Unable to calculate refund amount'),
          action: 'sell'
        })
        return
      } 
      onStatusChange({ type: 'pending', message: 'Selling tokens...', action: 'sell' })
      await sellTokens()
    } catch (e) {
      onStatusChange({ 
        type: 'error', 
        error: e as Error,
        action: needsTokenApproval ? 'approve' : 'sell'
      })
    }
  }

  return (
    <button 
      onClick={handleSell}
      disabled={isSelling || isTokenApproving || !quantity || !canSell}
      className="w-full px-4 py-2 rounded-lg button-text bg-gradient-to-r from-blue-400 to-violet-500 hover:from-blue-500 hover:to-violet-600 text-white transition-all duration-200 disabled:opacity-50 shadow hover:shadow-md"
    >
      {isTokenApproving ? `Approving ${token.symbol}...` :
       isSelling ? 'Selling...' :
       needsTokenApproval ? `Approve ${token.symbol}` :
       !canSell && quantity ? `Insufficient balance (Have: ${tokenBalance?.toString() || 0}, Need: ${quantity})` :
       `Sell ${token.symbol}`}
    </button>
  )
}

export default SellButton

