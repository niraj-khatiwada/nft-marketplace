import React from 'react'
import { Web3ReactProvider } from '@web3-react/core'

import {
  metamask,
  metamaskHooks,
  walletconnect,
  walletConnectHooks,
} from '../helpers/connectors'

export default function WalletProvider({ children = null }) {
  return (
    <Web3ReactProvider
      connectors={[
        [metamask, metamaskHooks],
        [walletconnect, walletConnectHooks],
      ]}
    >
      {children}
    </Web3ReactProvider>
  )
}
