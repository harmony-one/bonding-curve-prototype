import { formatUnits } from 'viem'

export function formatTokenPrice(price: bigint, decimals: number = 18): string {
  const formatted = formatUnits(price, decimals)
  const numValue = parseFloat(formatted)
  
  if (numValue === 0) {
    return '0'
  }
  
  // If the number is very small, show in scientific notation
  if (numValue < 0.00000001) {
    return numValue.toExponential(2)
  }
  
  // Otherwise, show 8 decimal places
  return numValue.toFixed(8).replace(/\.?0+$/, '')
}
