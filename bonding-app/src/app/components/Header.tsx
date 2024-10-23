'use client'

import React from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

const Header: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <header className="p-4 bg-gray-100">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Meme Coin Battle</h1>
        <div>
          {isConnected ? (
            <div>
              <span className="mr-4">{address}</span>
              <button 
                onClick={() => disconnect()}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header