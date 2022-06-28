import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

import Router from './Router'
import { WalletProvider } from './providers'

export default function App() {
  const queryClient = new QueryClient()

  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </WalletProvider>
  )
}
