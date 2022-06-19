import React from 'react'
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'

import Wallet from './components/Wallets.old'

export const Web3Context = React.createContext({ web3: null, provider: null })
Web3Context.displayName = 'Web3Provider'

export default function App() {
  const [web3Api, setWeb3Api] = React.useState({ web3: null, provider: null })

  React.useEffect(() => {
    ;(async function () {
      try {
        const provider = await detectEthereumProvider()
        if (provider) {
          setWeb3Api({
            provider,
            web3: new Web3(provider),
          })
        }
      } catch (error) {
        // The error will be thrown here when we try to connect in mobile browsers since we cannot inject the wallet scripts in it. Just like nafter.io we need to tell login with Metamask inside wallet connect or use built in browser of metamask (webview)
      }
    })()
  }, [])

  return (
    <Web3Context.Provider value={web3Api}>
      <Wallet />
    </Web3Context.Provider>
  )
}
