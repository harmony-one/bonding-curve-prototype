import React, { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  useBuyToken, 
  useApproveReserveToken,
  useReserveTokenAllowance,
  useGetCost,
  useTokenBalance,
  useReserveTokenBalance,
} from '@/web3/hooks/useToken'
import { useBalanceUpdate } from '@/web3/hooks/useBalanceUpdate'
import { TokenButtonProps } from './types'

const BuyButton: React.FC<TokenButtonProps> = ({ token, quantity, onStatusChange, onQuantityChange  }) => {
  const { address } = useAccount()
  const { data: cost } = useGetCost(token.tokenAddress, quantity)
  const { data: tokenBalance, refetch: refetchTokenBalance } = useTokenBalance(token.tokenAddress, address)
  const { data: reserveBalance, refetch: refetchReserveBalance } = useReserveTokenBalance(address)
  const { data: allowance, refetch: refetchAllowance } = useReserveTokenAllowance(address)
  const { triggerUpdate } = useBalanceUpdate(token.tokenAddress)
  
  const { 
    buyTokens, 
    isPending: isBuying, 
    isSuccess: isBuySuccess 
  } = useBuyToken(token.tokenAddress, quantity)

  const { 
    approveToken, 
    isPending: isApproving,
    isSuccess: isApproveSuccess
  } = useApproveReserveToken(cost?.toString() || '0')


  const needsApproval = (() => {
    if (!quantity || !cost || allowance === undefined) return false
    const costValue = (cost as bigint)
    return costValue > allowance
  })()

  useEffect(() => {
    const executeBuyAfterApproval = async () => {
      if (isApproveSuccess && quantity) {
        await refetchAllowance()
        onStatusChange({ type: 'pending', message: 'Buying tokens...', action: 'buy' })
        try {
          await buyTokens()
        } catch (e) {
          onStatusChange({ 
            type: 'error', 
            error: e as Error,
            action: 'buy'
          })
        }
      }
    }
    executeBuyAfterApproval()
  }, [isApproveSuccess])

  useEffect(() => {
    const updateBalances = async () => {
      if (isBuySuccess) {
        onStatusChange({ type: 'pending', message: 'Updating balances...', action: 'buy' })
        await Promise.all([
          refetchTokenBalance(),
          refetchReserveBalance(),
          refetchAllowance(),
          triggerUpdate(),
        ])
        onStatusChange({ type: 'success', message: 'Transaction successful!', action: 'buy' })
        onQuantityChange('')
      }
    }
    updateBalances()
  }, [isBuySuccess])

  useEffect(() => {
    if (isBuySuccess) {
      const refreshData = async () => {
        onStatusChange({ type: 'pending', message: 'Updating balances...', action: 'buy' })
        await Promise.all([
          refetchTokenBalance(),
          refetchReserveBalance(),
          refetchAllowance()
        ])
        onStatusChange({ type: 'success', message: 'Transaction successful!', action: 'buy' })
        onQuantityChange('')
      }
      refreshData()
    }
  }, [isBuySuccess])

  useEffect(() => {
    if (isApproveSuccess) {
      const refreshApproval = async () => {
        await refetchAllowance()
        onStatusChange({ type: 'success', message: 'Approval successful!', action: 'approve' })
      }
      refreshApproval()
    }
  }, [isApproveSuccess])

  const handleBuy = async () => {
    if (!quantity) return
    try {
      if (needsApproval) {
        onStatusChange({ type: 'pending', message: 'Approving ONE...', action: 'approve' })
        await approveToken()
        return
      }
      onStatusChange({ type: 'pending', message: 'Buying tokens...', action: 'buy' })
      await buyTokens()
    } catch (e) {
      onStatusChange({ 
        type: 'error', 
        error: e as Error,
        action: needsApproval ? 'approve' : 'buy'
      })
    }
  }

  return (
    <button 
      onClick={handleBuy}
      disabled={isBuying || isApproving || !quantity}
      className="w-full px-4 py-2 rounded-lg button-text bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white transition-all duration-200 disabled:opacity-50 shadow hover:shadow-md"
    >
      {isApproving ? 'Approving ONE...' : 
       isBuying ? 'Buying...' : 
       needsApproval ? `Approve ONE` :
       `Buy ${token.symbol}`}
    </button>
  )
}

export default BuyButton