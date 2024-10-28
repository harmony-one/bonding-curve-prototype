import { TokenInfo } from '@/web3/hooks/useTokenList';
import { useTokenPrice } from '@/web3/hooks/useTokenPrice';
import { formatTokenPrice } from '@/web3/utils/helper';
import React, { useEffect } from 'react';

const TokenListItem: React.FC<{ token: TokenInfo}> = ({ token }) => {
  const { data: currentPrice } = useTokenPrice(token.tokenAddress);
    const formattedPrice = React.useMemo(() => {
    if (currentPrice !== undefined && currentPrice !== null) {
      return formatTokenPrice(currentPrice, 18)
    } else if (token.currentPrice !== undefined) {
      return formatTokenPrice(token.currentPrice, 18);
    }
    return 'N/A';
  }, [currentPrice, token.currentPrice]);
  return (
    <li>
      {token.name} ({token.symbol}) - Current Price: {formattedPrice} ONE
    </li>
  );
};

export default TokenListItem