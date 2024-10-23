import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { 
  useBuyToken, 
  useSellToken, 
  useTokenBalance,
  useReserveTokenAllowance,
  useApproveReserveToken,
  useReserveTokenBalance
} from '../../web3/hooks/useToken'
import { TokenInfo } from '@/web3/hooks/useTokenList'

interface TokenTraderProps {
  token: TokenInfo
  onClose: () => void
}

const TokenTrader: React.FC<TokenTraderProps> = ({ token, onClose }) => {
  const [amount, setAmount] = useState('')
  const { address } = useAccount()

  const { data: tokenBalance, isLoading: balanceLoading } = useTokenBalance(token.tokenAddress, address)
  const { data: reserveBalance, isLoading: reserveBalanceLoading } = useReserveTokenBalance(address)
  const { data: allowance, isLoading: allowanceLoading, refetch: refetchAllowance } = useReserveTokenAllowance(address)

  const { buyTokens, isPending: isBuying, isError: isBuyError, error: buyError } = useBuyToken(token.tokenAddress, amount)
  const { sellTokens, isPending: isSelling, isError: isSellError, error: sellError } = useSellToken(token.tokenAddress, amount)
  const { approveTokens, isPending: isApproving, isError: isApproveError, error: approveError} = useApproveReserveToken(amount)

  // Debug logs
  useEffect(() => {
    console.log('Current allowance:', allowance?.toString())
    if (amount) {
      const parsedAmount = parseEther(amount)
      console.log('Amount to spend:', parsedAmount.toString())
      console.log('Needs approval:', allowance !== undefined && parsedAmount > allowance)
    }
  }, [allowance, amount])

  const handleBuy = () => {
    if (!amount) return
    buyTokens()
  }

  const handleSell = () => {
    if (!amount) return
    sellTokens()
  }

  const handleApprove = async () => {
    if (!amount) return
    await approveTokens()
    refetchAllowance()
  }

  if (balanceLoading || allowanceLoading || reserveBalanceLoading) {
    return <div>Loading...</div>
  }

  const needsApproval = (() => {
    if (!amount || allowance === undefined) return false
    try {
      const parsedAmount = parseEther(amount)
      return parsedAmount > allowance
    } catch (e) {
      console.error('Error parsing amount:', e)
      return false
    }
  })()

  return (
    <div>
      <h3>{token.name} ({token.symbol})</h3>
      <p>Your token balance: {formatEther(tokenBalance || BigInt(0))} {token.symbol}</p>
      <p>Your reserve token balance: {formatEther(reserveBalance || BigInt(0))} ONE</p>
      <p>Current allowance: {allowance !== undefined ? formatEther(allowance) : '0'} ONE</p>
      
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
        placeholder="Amount"
        min="0"
        step="0.000000000000000001"
      />

      {needsApproval ? (
        <button onClick={handleApprove} disabled={isApproving || !amount}>
          {isApproving ? 'Approving...' : 'Approve ONE tokens for trading'}
        </button>
      ) : (
        <>
          <button onClick={handleBuy} disabled={isBuying || !amount}>
            {isBuying ? 'Buying...' : `Buy ${amount} ${token.symbol}`}
          </button>
          <button onClick={handleSell} disabled={isSelling || !amount}>
            {isSelling ? 'Selling...' : `Sell ${amount} ${token.symbol}`}
          </button>
        </>
      )}

      {buyError && <p>Error buying tokens: {buyError.message}</p>}
      {sellError && <p>Error selling tokens: {sellError.message}</p>}
      {approveError && <p>Error approving tokens: {approveError.message}</p>}
    </div>
  )
}

export default TokenTrader
