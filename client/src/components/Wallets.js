import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, Spinner } from 'react-bootstrap'

// import {
//   injected,
//   walletconnect,
//   resetWalletConnector,
// } from '../helpers/connectors'
import Balance from './Balance'
import Network from './Network'
import SendFundToOwner from './SendFundToOwner'

import useWeb3 from '../hooks/useWeb3'

const Web3ReactConnectionComponent = () => {
  const {
    custom: {
      connectMetamask,
      connectWalletConnect,
      disconnectWallet,
      isLoading,
    },
    ...web3
  } = useWeb3()

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
      {web3?.error == null ? null : (
        <p style={{ color: 'tomato' }}>{web3.error.message}</p>
      )}
      {!web3.account ? (
        <div className="flex space-x-3">
          <Button
            onClick={connectMetamask}
            style={{ display: 'block', margin: '10px 0' }}
          >
            Connect Metamask Via Web3-React
          </Button>
        </div>
      ) : null}
      {!web3.account ? (
        <div
          className="flex space-x-3"
          style={{ display: 'block', margin: '10px 0' }}
        >
          <Button onClick={connectWalletConnect}>
            Connect walletconnect Via Web3-React
          </Button>
        </div>
      ) : null}
      {web3?.account || !(web3.error == null) ? (
        <Button
          onClick={disconnectWallet}
          style={{ display: 'block', margin: '10px 0' }}
        >
          Disconnect Web3React
        </Button>
      ) : null}
    </div>
  )
}
export default Web3ReactConnectionComponent
