import { TokenInfo } from '@/web3/hooks/useTokenList'

export interface TokenTraderProps {
  token: TokenInfo
  onClose: () => void
}

export interface TradeStatus {
  type: 'idle' | 'pending' | 'success' | 'error'
  message?: string
  error?: Error
  action: 'buy' | 'sell' | 'approve'
}

export interface TokenButtonProps {
  token: TokenInfo
  quantity: string
  onStatusChange: (status: TradeStatus) => void
  onQuantityChange: (quantity: string) => void
}