import { TokenInfo, useTokenList } from '@/web3/hooks/useTokenList';
import React, { useEffect, useState } from 'react';
import TokenListItem from './TokenListItem';
import { TokenTrader } from './token-trader/TokenTrader';
import TokenBalances from './TokenBalance';


const TokenList = () => {
  const { data: tokens, isLoading, isError, error, refetch } = useTokenList();

  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  
  useEffect(() => {
    const interval = setInterval(refetch, 30000); // Refetch every 30 seconds
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching tokens</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Token List Section */}
        <div className="lg:w-4/5 w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Token List</h2>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all duration-200 shadow hover:shadow-md"
            >
              Refresh All Data
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <ul className="divide-y divide-gray-100">
              {tokens?.map((token: TokenInfo) => (
                <li key={token.tokenAddress} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <TokenListItem token={token} />
                  <button 
                    onClick={() => setSelectedToken(token)}
                    className="ml-4 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all duration-200 shadow hover:shadow-md"
                  >
                    Trade
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lg:w-2/5 w-full">
          <div className="sticky top-4 space-y-4">
            <TokenBalances tokens={tokens || []} />
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
              {selectedToken ? (
                <TokenTrader 
                  token={selectedToken} 
                  onClose={() => setSelectedToken(null)}
                />
              ) : (
                <div className="text-center text-gray-500 p-4">
                  Select a token to trade
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenList;