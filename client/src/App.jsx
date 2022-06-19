import React from 'react'

import Wallet from './components/Wallets'
import { WalletProvider } from './providers'

export default function App() {
  return (
    <WalletProvider>
      <Wallet />
    </WalletProvider>
  )
}
