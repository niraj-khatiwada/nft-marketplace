import React from 'react'

import { Web3Context } from '../App'

const NETWORK_MAPPING = {
  1: 'Ethereum Mainnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon TestNet(Mumbai)',
}

export default function Wallet() {
  const { web3, provider } = React.useContext(Web3Context)

  const [account, setAccount] = React.useState()
  const [chainId, setChainId] = React.useState()

  const requestAccountInfo = async () => {
    if (web3) {
      try {
        const accounts = await provider?.request?.({
          method: 'eth_requestAccounts',
        })
        console.log('Connected Account', accounts[0])
        console.log('Network', web3.networkVersion)

        // Output ['0x8af64d0b00d8243e2555d9322dd077100e90e717'] => Will always gives the account array with length = 1/ This is the account that is connected currently, not all the accounts of metamask.
        setAccount(accounts?.[0])
      } catch (error) {
        /*
          error?.code === 4001 => User rejected the wallet connection
        */
        console.log('Metamask connection error', error)
      }
    }
  }

  React.useEffect(() => {
    if (web3) {
      ;(async function () {
        try {
          const [accounts, chain] = await Promise.all([
            web3.eth.getAccounts(),
            web3.eth.getChainId(),
          ])

          setAccount(accounts?.[0] ?? null)
          setChainId(chain)
        } catch (error) {
          console.log('--', error)
        }
      })()
      // Account Change
      // console.log(web3.eth.accounts)
      // provider?.on?.('accountsChanged', (accounts) => {
      //   console.log('Accounts changed', accounts)
      //   console.log('Network', provider.networkVersion)
      //   // If accounts is empty it means, all the accounts has been disconnected from the site
      //   setAccount(accounts[0])
      // })
      // // Network Change
      // provider?.on?.('chainChanged', (_chainId) => {
      //   // Returns hexadecimal version. So convert it to decimal
      //   const chainId = parseInt(_chainId, 16)
      //   console.log('Network changed', chainId)
      //   setNetworkVersion(chainId)
      // })
    }
  }, [web3])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {account == null ? (
        <button onClick={requestAccountInfo}>Connect account</button>
      ) : (
        <>
          <p>{account}</p>
          <p>Network: {NETWORK_MAPPING[chainId] ?? 'Unknown Network'}</p>
        </>
      )}
      <p>Metamask is {web3 == null ? 'not' : ''} installed</p>
    </div>
  )
}

// Info
/*
  ChainId for networks:
    Mainnet: 1
    Kovan: 42
    Ropsten: 3
    Rinkeby: 4
    Goerli: 5

  ChainList: https://chainlist.org/

  For our app in production, we will only allow:
    Ethereum Mainnet: 1
    Polygon Mainnet: 137
  
  For development,
   Mumbai Testnet(Polygon): 80001
*/
