'use client'

import { isSupportedChain, supportedChains, useChainStore } from '@/web3/client'
import React, { useEffect } from 'react'
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import logo from '../../../public/TokenBattle.jpg'

const Header: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const setCurrentChain = useChainStore(state => state.setCurrentChain)

  // Update viem client when network changes
  useEffect(() => {
    if (chainId) {
      const matchedChain = supportedChains.find(c => c.id === chainId)
      if (matchedChain) {
        console.log('Switching viem client to:', matchedChain.name)
        setCurrentChain(matchedChain)
      }
    }
  }, [chainId, setCurrentChain])

  const getCurrentNetworkName = () => {
    const chain = supportedChains.find(c => c.id === chainId)
    return chain?.name || 'Unknown Network'
  }

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Logo Circle */}
            {/* <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-md"> */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <img 
                src="/TokenBattle.jpg" 
                alt="Meme Battle" 
                className="w-10 h-10 rounded-full"
              />
            </div>
            {/* App Name */}
            <h1 className="text-xl font-bold text-gray-900">Meme Battle</h1>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">
                    {getCurrentNetworkName()}
                  </span>
                  {!isSupportedChain(chainId) && (
                    <span className="ml-2 text-xs text-red-500">
                      Unsupported network
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-mono text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button 
                    onClick={() => disconnect()}
                    className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium transition-all duration-200 shadow hover:shadow-md"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={() => connect({ connector: injected() })}
                className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition-all duration-200 shadow hover:shadow-md"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header