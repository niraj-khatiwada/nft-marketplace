import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'

import Router from './Router'
import { WalletProvider } from './providers'
import { metamask, walletconnect } from './helpers/connectors'
import useWeb3 from './hooks/useWeb3'

export default function App() {
  const queryClient = new QueryClient()

  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <EagerConnection />
        <Router />
      </QueryClientProvider>
    </WalletProvider>
  )
}

// Graphql => Our Server
// REST API => Blockchain Server

function EagerConnection() {
  const { ...web3 } = useWeb3()
  const firstRef = React.useRef(true)

  React.useEffect(() => {
    if (!(web3 == null) && firstRef.current) {
      firstRef.current = false
      const lastConnector = localStorage.getItem('connector')
      switch (lastConnector) {
        case 'metamask':
          metamask.connectEagerly().catch(() => {
            console.debug('Failed to connect eagerly to metamask')
          })

          break
        case 'wallet_connect':
          walletconnect.connectEagerly().catch(() => {
            console.debug('Failed to connect eagerly to metamask')
          })
          break
        default:
      }
    }
  }, [web3 == null, metamask.connectEagerly, walletconnect.connectEagerly])

  return null
}
