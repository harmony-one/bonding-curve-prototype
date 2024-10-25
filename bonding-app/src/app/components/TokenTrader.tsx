import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { 
  useBuyToken, 
  useSellToken, 
  useTokenBalance,
  useReserveTokenAllowance,
  useApproveReserveToken,
  useReserveTokenBalance,
  useGetCost
} from '../../web3/hooks/useToken'
import { TokenInfo } from '@/web3/hooks/useTokenList'
import { useChainStore } from '@/web3/client'
import { AlertCircle, X } from 'lucide-react'

interface TokenTraderProps {
  token: TokenInfo
  onClose: () => void
}

const TokenTrader: React.FC<TokenTraderProps> = ({ token, onClose }) => {
  const [quantity, setQuantity] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const { address } = useAccount()

  const fco = useChainStore()
  const { data: tokenBalance, isLoading: balanceLoading, refetch: refetchTokenBalance } = useTokenBalance(token.tokenAddress, address)
  const { data: reserveBalance, isLoading: reserveBalanceLoading, refetch: refetchReserveBalance } = useReserveTokenBalance(address)
  const { data: allowance, isLoading: allowanceLoading, refetch: refetchAllowance } = useReserveTokenAllowance(address)
  const { data: cost } = useGetCost(token.tokenAddress, quantity) // New hook to get cost

  const { buyTokens, isPending: isBuying, isSuccess: isBuySuccess, isError: isBuyError, error: buyError } = useBuyToken(token.tokenAddress, quantity)
  const { sellTokens, isPending: isSelling, isError: isSellError, error: sellError } = useSellToken(token.tokenAddress, quantity)
  const { approveTokens, isPending: isApproving, isError: isApproveError, error: approveError} = useApproveReserveToken(cost?.toString() || '0')

  const formatErrorMessage = (error: Error) => {
    const message = error.message
    // Check if it's a contract revert error
    if (message.includes('reverted')) {
      // Extract the main reason if possible
      const reasonMatch = message.match(/reason: (.*?)(?=\n|Contract Call|$)/)
      return reasonMatch ? reasonMatch[1].trim() : message
    }
    return message
  }

  useEffect(() => {
    console.log('Current allowance:', allowance?.toString())
    if (quantity) {
      const parsedAmount = parseEther(quantity)
      console.log('Amount to spend:', parsedAmount.toString())
      console.log('Needs approval:', allowance !== undefined && parsedAmount > allowance)
    }
  }, [allowance, quantity])

  const needsApproval = (() => {
    if (!quantity || !cost || allowance === undefined) return false
    const costValue = (cost as bigint)
    return costValue > allowance
  })()

  // Handlers for transactions
  const handleApprove = async () => {
    if (!quantity) return
    try {
      await approveTokens()
      await refetchAllowance()
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  useEffect(() => {
    const buyClearance = async () => {
      await Promise.all([
        refetchTokenBalance(),
        refetchReserveBalance(),
        refetchAllowance()
      ])
      setTimeout(() => setShowSuccess(false), 3000)
      setQuantity('')
      setShowSuccess(true)
    }
    if (isBuySuccess) {
      buyClearance()
    }
  }, [isBuySuccess])

  const handleBuy = async () => {
    if (!quantity) return
    try {
      const costValue = (cost as bigint)
      if (costValue && allowance !== undefined && costValue > allowance) {
        await handleApprove()
        return
      }
      await buyTokens()
    } catch (e) {
      console.error('Buy failed:', e)
    }
  }

  const handleSell = async () => {
    if (!quantity) return
    try {
      await sellTokens()
    } catch (e) {
      console.error('Sell failed:', e)
    }
  }

  useEffect(() => {
    if (needsApproval) {
      refetchAllowance()
    }
  }, [needsApproval, refetchAllowance])


  if (balanceLoading || allowanceLoading || reserveBalanceLoading) {
    return <div>Loading...</div>
  }


  const error = buyError || sellError || approveError
  const hasError = isBuyError || isSellError || isApproveError

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="heading-3">{token.symbol}</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="text-body-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-muted">Token Balance:</span>
            <div className="text-right">
              <div className="text-mono">{formatEther(tokenBalance || BigInt(0))} {token.symbol}</div>
              <div className="text-xs text-gray-500">
                Value: {formatEther((tokenBalance || BigInt(0)) * (token.currentPrice || BigInt(0)))} ONE
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">ONE Balance:</span>
            <span className="text-mono">{formatEther(reserveBalance || BigInt(0))} ONE</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="form-label">Amount</label>
        <input 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          placeholder="Enter quantity of tokens"
          min="0"
          step="0.000000000000000001"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 text-body placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
        <div className="text-sm text-gray-600 mt-1">
          Total Cost: {cost ? BigInt(cost?.toString()) : '0'} ONE
        </div>
      </div>
      {isBuying && (
        <div className="rounded-lg border border-green-200 p-4 text-sm text-gray-500">
          Processing transaction...
        </div>
      )}
      {showSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-600">
          Transaction successful! Tokens purchased.
        </div>
      )}
      {/* Error Messages */}
      {hasError && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm space-y-2">
          <div className="flex items-start space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-medium">Transaction Failed</div>
          </div>
          <div className="text-red-600 pl-7 break-all">
            {formatErrorMessage(error)}
          </div>
          {error.message.includes('Docs:') && (
            <div className="text-red-500 pl-7 text-xs">
              <a 
                href={error.message.split('Docs: ')[1].split('\n')[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View Documentation ↗
              </a>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {needsApproval ? (
          <button 
            onClick={handleApprove}
            disabled={isApproving || !quantity}
            className="w-full px-4 py-2 rounded-lg button-text bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-200 disabled:opacity-50 shadow hover:shadow-md"
          >
            {isApproving ? 'Approving...' : 'Approve ONE'}
          </button>
        ) : (
          <div className="space-y-2">
            <button 
              onClick={handleBuy}
              disabled={isBuying || !quantity}
              className="w-full px-4 py-2 rounded-lg button-text bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white transition-all duration-200 disabled:opacity-50 shadow hover:shadow-md"
            >
              {isBuying ? 'Buying...' : `Buy ${token.symbol}`}
            </button>
            <button 
              onClick={handleSell}
              disabled={isSelling || !quantity}
              className="w-full px-4 py-2 rounded-lg button-text bg-gradient-to-r from-blue-400 to-violet-500 hover:from-blue-500 hover:to-violet-600 text-white transition-all duration-200 disabled:opacity-50 shadow hover:shadow-md"
            >
              {isSelling ? 'Selling...' : `Sell ${token.symbol}`}
            </button>
          </div>
        )}
      </div>

      <div className="text-body-xs text-center">
        {allowance !== undefined && (
          <span>Current allowance: {formatEther(allowance)} ONE</span>
        )}
      </div>
    </div>
  );
};

export default TokenTrader;


