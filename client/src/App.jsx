import React from 'react'

import Router from './Router'
import { WalletProvider } from './providers'

export default function App() {
  return (
    <WalletProvider>
      <Router />
    </WalletProvider>
  )
}
