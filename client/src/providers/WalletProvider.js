import React from 'react'
import { Web3ReactProvider } from '@web3-react/core'
import Web3 from 'web3'

export default function WalletProvider({ children = null }) {
  const getLibrary = (provider) => {
    const library = new Web3(provider)
    return library
  }
  return (
    <Web3ReactProvider getLibrary={getLibrary}>{children}</Web3ReactProvider>
  )
}
