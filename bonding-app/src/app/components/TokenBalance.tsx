import React from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useTokenBalance } from '@/web3/hooks/useToken'
import { TokenInfo } from '@/web3/hooks/useTokenList'
import { useBalanceUpdate } from '@/web3/hooks/useBalanceUpdate'

const TokenBalance = ({ token }: { token: TokenInfo }) => {
  const { address } = useAccount()
  const { balance, isLoading } = useBalanceUpdate(token.tokenAddress)
  // const { data: balance, isLoading } = useTokenBalance(token.tokenAddress, address)
  
  if (isLoading) return <div className="animate-pulse h-4 bg-gray-200 rounded w-24" />
  
  const formattedBalance = balance ? balance.toString() : '0'

  const value = balance ? formatEther(balance * (token.currentPrice || BigInt(0))) : '0'
  
  return (
    <div className="flex justify-between items-center py-2">
      <span className="font-medium text-gray-700">{token.symbol}</span>
      <div className="text-right">
        <div className="text-sm font-mono">{formattedBalance}</div>
        <div className="text-xs text-gray-500">{value} ONE</div>
      </div>
    </div>
  )
}

const TokenBalances = ({ tokens }: { tokens: TokenInfo[] }) => {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Your Balances</h3>
          <div className="text-sm text-gray-500">Connect wallet to view balances</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Your Balances</h3>
        <div className="divide-y">
          {tokens.map(token => (
            <TokenBalance key={token.tokenAddress} token={token} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TokenBalances