import React from 'react'
import { useWeb3React } from '@web3-react/core'

import {
  injected,
  walletconnect,
  resetWalletConnector,
} from '../helpers/connectors'

export default function useWeb3() {
  const web3 = useWeb3React()

  const [isLoading, setIsLoading] = React.useState(false)
  const firstRef = React.useRef(true)

  const disconnectWallet = () => {
    try {
      setIsLoading(true)
      web3.deactivate()
      localStorage.removeItem('connector')
      localStorage.removeItem('walletconnect')
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
    } catch (ex) {
      console.log(ex)
    } finally {
      setIsLoading(false)
    }
  }

  const connectMetamask = async () => {
    try {
      setIsLoading(true)
      await web3.activate(injected)
      window.localStorage.setItem('connector', 'metamask')
    } catch (ex) {
      console.log(ex)
      disconnectWallet()
    } finally {
      setIsLoading(false)
    }
  }

  const connectWalletConnect = async () => {
    try {
      setIsLoading(true)
      resetWalletConnector(walletconnect)
      await web3.activate(walletconnect)
      window.localStorage.setItem('connector', 'walletconnect')
    } catch (ex) {
      console.log(ex)
      disconnectWallet()
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (!(web3 == null) && firstRef.current) {
      firstRef.current = false
      const savedConnector = window.localStorage.getItem('connector')
      switch (savedConnector) {
        case 'metamask':
          connectMetamask()
          break
        case 'walletconnect':
          connectWalletConnect()
          break
        default:
      }
    }
  }, [web3 == null, connectMetamask, connectWalletConnect])

  return {
    ...web3,
    custom: {
      isLoading,
      connectMetamask,
      connectWalletConnect,
      disconnectWallet,
    },
  }
}
