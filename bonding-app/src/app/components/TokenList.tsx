import { TokenInfo, useTokenList } from '@/web3/hooks/useTokenList';
import React, { useEffect, useState } from 'react';
import TokenListItem from './TokenListItem';
import TokenTrader from './TokenTrader';


const TokenList = () => {
  const { data: tokens, isLoading, isError, error, refetch } = useTokenList();

  console.log('FCO:::::: error', error, isError)

  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  
  useEffect(() => {
    const interval = setInterval(refetch, 30000); // Refetch every 30 seconds
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching tokens</div>;

  return (
    <div>
      <h2>Token List</h2>
      <button onClick={() => refetch()}>Refresh All Data</button>
      <ul>
        {tokens?.map((token: TokenInfo) => (
          <li key={token.tokenAddress}>
            <TokenListItem token={token} />
            <button onClick={() => setSelectedToken(token)}>Trade {token.symbol}</button>
          </li>
        ))}
      </ul>
      {selectedToken && (
        <TokenTrader 
          token={selectedToken} 
          onClose={() => setSelectedToken(null)}
        />
      )}
    </div>
  );
};

export default TokenList;