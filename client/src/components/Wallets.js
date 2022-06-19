import React from 'react'
import { useWeb3React } from '@web3-react/core'

import {
  injected,
  walletconnect,
  resetWalletConnector,
} from '../helpers/connectors'
import Balance from './Balance'
import Network from './Network'
import SendFundToOwner from './SendFundToOwner'

const Web3ReactConnectionComponent = () => {
  const web3 = useWeb3React()

  const firstRef = React.useRef(true)

  const disconnectWallet = () => {
    try {
      web3.deactivate()
      localStorage.removeItem('connector')
      localStorage.removeItem('walletconnect')
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE')
    } catch (ex) {
      console.log(ex)
    }
  }

  //web3react context
  const checkInfoSimple = async () => {
    try {
      console.log(web3)
    } catch (ex) {
      console.log(ex)
    }
  }

  //web3react metamask
  const connectMetamaskSimple = async () => {
    try {
      await web3.activate(injected)
      window.localStorage.setItem('connector', 'metamask')
    } catch (ex) {
      console.log(ex)
      disconnectWallet()
    }
  }

  //web3react walletconnect
  const connectWalletConnectSimple = async () => {
    try {
      resetWalletConnector(walletconnect)
      const abc = await web3.activate(walletconnect)
      window.localStorage.setItem('connector', 'walletconnect')
    } catch (ex) {
      console.log(ex)
      disconnectWallet()
    }
  }

  React.useEffect(() => {
    if (!(web3 == null) && firstRef.current) {
      firstRef.current = false
      const savedConnector = window.localStorage.getItem('connector')
      switch (savedConnector) {
        case 'metamask':
          connectMetamaskSimple()
          break
        case 'walletconnect':
          connectWalletConnectSimple()
          break
        default:
      }
    }
  }, [web3, connectMetamaskSimple, connectWalletConnectSimple])

  return (
    <div>
      <h2>Web3React Control</h2>
      {web3.account ? (
        <>
          <p>Account: {web3?.account}</p>
          <Balance />
          <Network />
          <SendFundToOwner />
        </>
      ) : (
        <p>Not connected</p>
      )}
      {web3.error == null ? null : (
        <p style={{ color: 'tomato' }}>{web3.error.message}</p>
      )}
      <div>
        <button
          onClick={checkInfoSimple}
          style={{ display: 'block', margin: '10px 0' }}
        >
          Check web3react Context
        </button>
      </div>
      {!web3.account ? (
        <div className="flex space-x-3">
          <button
            onClick={connectMetamaskSimple}
            style={{ display: 'block', margin: '10px 0' }}
          >
            Connect Metamask Via Web3-React
          </button>
        </div>
      ) : null}
      {!web3.account ? (
        <div
          className="flex space-x-3"
          style={{ display: 'block', margin: '10px 0' }}
        >
          <button onClick={connectWalletConnectSimple}>
            Connect walletconnect Via Web3-React
          </button>
        </div>
      ) : null}
      {web3?.account || !(web3.error == null) ? (
        <button
          onClick={disconnectWallet}
          style={{ display: 'block', margin: '10px 0' }}
        >
          Disconnect Web3React
        </button>
      ) : null}
    </div>
  )
}
export default Web3ReactConnectionComponent
