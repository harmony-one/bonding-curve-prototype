import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { X } from 'lucide-react'
import { 
  useGetCost,
  useTokenBalance,
  useReserveTokenBalance,
} from '@/web3/hooks/useToken'
import { formatEther } from 'viem'
import { TokenTraderProps, TradeStatus } from './types'
import SellButton from './SellButton'
import BuyButton from './BuyButton'
import StatusMessage from './StatusMessage'

export const TokenTrader = ({ token, onClose }: TokenTraderProps) => {
  const [quantity, setQuantity] = useState('')
  const { address } = useAccount()
  const [status, setStatus] = useState<TradeStatus>({ type: 'idle', action: 'buy' })
  const { data: tokenBalance, isLoading: balanceLoading, refetch: refetchTokenBalance } = useTokenBalance(token.tokenAddress, address)
  const { data: reserveBalance, isLoading: reserveBalanceLoading, refetch: refetchReserveBalance } = useReserveTokenBalance(address)
  const { data: cost } = useGetCost(token.tokenAddress, quantity) // New hook to get cost

  // Reset status after 3 seconds on success
  useEffect(() => {
    if (status.type === 'success') {
      const timer = setTimeout(() => {
        setStatus({ type: 'idle', action: 'buy' })
        setQuantity('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const formattedBalance = tokenBalance ? tokenBalance.toString() : '0'

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
              <div className="text-mono">{formattedBalance} {token.symbol}</div>
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
      
      {/* Status/Error Messages */}
      <StatusMessage status={status} />
      
      <div className="space-y-2">
        <BuyButton 
          token={token} 
          quantity={quantity} 
          onStatusChange={setStatus}
          onQuantityChange={setQuantity}
        />
        <SellButton 
          token={token} 
          quantity={quantity} 
          onStatusChange={setStatus}
          onQuantityChange={setQuantity}
        />
      </div>
    </div>
  )
}