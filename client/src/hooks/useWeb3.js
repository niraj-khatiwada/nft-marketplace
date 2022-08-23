import React from 'react'
import { useWeb3React } from '@web3-react/core'
import Web3 from 'web3'

import {
  metamask,
  metamaskHooks,
  walletconnect,
  walletConnectHooks,
  CURRENCY,
  CHAIN_IDS,
  getConnectorName as _getConnectorName,
} from '../helpers/connectors'

const DEFAULT_INTERVAL = 500
const DEFAULT_BLOCKS_TO_WAIT = 0

const {
  useChainId: useChainIdFromMetamask,
  useIsActive: useIsMetamaskActive,
  useIsActivating,
} = metamaskHooks
const {
  useChainId: useChainIdFromWalletConnect,
  useIsActive: useIsWalletConnectActive,
} = walletConnectHooks

export const errorsMapping = {
  UnsupportedChainIdError: {
    name: 'UnsupportedChainIdError',
    message: 'Chain Id is not supported',
  },
  NoMetaMaskError: {
    name: 'NoMetaMaskError',
    message:
      'Metamask extension is not installed or is not supported in this platform',
  },
}

export default function useWeb3() {
  const [error, setError] = React.useState(null)
  const walletConnectedRef = React.useRef(null)
  const mountedRef = React.useRef(false)

  const web3 = useWeb3React()

  const chainId = web3?.chainId

  const chainIdFromMetamask = useChainIdFromMetamask()
  const chainIdFromWalletConnect = useChainIdFromWalletConnect()

  const isMetamaskActive = useIsMetamaskActive()
  const isWalletConnectActive = useIsWalletConnectActive()

  const [isLoading, setIsLoading] = React.useState(false)

  const isValidChainID = React.useMemo(
    () => (typeof chainId === 'number' ? CHAIN_IDS.includes(chainId) : null),
    [chainId]
  )

  const connectorName = React.useMemo(
    () => (isValidChainID ? _getConnectorName(web3.connector) : null),
    [web3.connector, isValidChainID]
  )

  const library = React.useMemo(
    () =>
      web3 == null ||
      web3.account == null ||
      connectorName == null ||
      connectorName === 'UNKNOWN'
        ? null
        : new Web3(
            connectorName === 'METAMASK'
              ? metamask.provider
              : walletconnect.provider
          ),
    [
      web3,
      metamask.provider,
      walletconnect.provider,
      connectorName,
      chainIdFromMetamask,
      chainIdFromWalletConnect,
    ]
  )

  const disconnectWallet = React.useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      if (web3?.connector?.deactivate) {
        web3.connector.deactivate()
      } else {
        web3?.connector?.resetState()
      }
      localStorage.removeItem('connector')
      walletConnectedRef.current = null
    } catch (error) {
      console.log('Wallet disconnect error', error)
    } finally {
      setIsLoading(false)
    }
  }, [web3])

  const connectMetamask = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const isValid = CHAIN_IDS.includes(chainIdFromMetamask)
      if (!(chainIdFromMetamask == null) && !isValid) {
        setError(errorsMapping.UnsupportedChainIdError)
        setIsLoading(false)
        return
      }
      await metamask.activate(isValid ? chainIdFromMetamask : null)
      window.localStorage.setItem('connector', 'metamask')
      walletConnectedRef.current = 'METAMASK'
    } catch (_error) {
      console.log('Metamask Wallet Connection Issue', _error)
      if (_error?.name === 'NoMetaMaskError') {
        setError(errorsMapping.NoMetaMaskError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [chainIdFromMetamask, metamask])

  const connectWalletConnect = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const isValid = CHAIN_IDS.includes(chainIdFromWalletConnect)
      if (!(chainIdFromWalletConnect == null) && !isValid) {
        setError(errorsMapping.UnsupportedChainIdError)
        setIsLoading(false)
        return
      }
      await walletconnect.activate(isValid ? chainIdFromWalletConnect : null)
      window.localStorage.setItem('connector', 'wallet_connect')
      walletConnectedRef.current = 'WALLET_CONNECT'
    } catch (error) {
      console.log('Wallet Connect connection issue', error)
    } finally {
      setIsLoading(false)
    }
  }, [chainIdFromWalletConnect, walletconnect])

  React.useEffect(() => {
    if (walletConnectedRef.current === 'METAMASK') {
      if (isMetamaskActive) {
        if (
          !(chainIdFromMetamask == null) &&
          !CHAIN_IDS.includes(chainIdFromMetamask)
        ) {
          setError(errorsMapping.UnsupportedChainIdError)
        } else {
          setError(null)
        }
      } else {
        if (CHAIN_IDS.includes(chainIdFromMetamask)) {
          setError(null)
          connectMetamask()
        }
      }
    } else if (walletConnectedRef.current === 'WALLET_CONNECT') {
      if (isWalletConnectActive) {
        if (
          !(chainIdFromWalletConnect == null) &&
          !CHAIN_IDS.includes(chainIdFromWalletConnect)
        ) {
          setError(errorsMapping.UnsupportedChainIdError)
        } else {
          setError(null)
        }
      } else {
        if (CHAIN_IDS.includes(chainIdFromWalletConnect)) {
          setError(null)
          connectWalletConnect()
        }
      }
    }
  }, [
    chainIdFromMetamask,
    isMetamaskActive,
    connectMetamask,
    chainIdFromWalletConnect,
    isWalletConnectActive,
    connectWalletConnect,
  ])

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      if (isMetamaskActive) {
        if (
          !(chainIdFromMetamask == null) &&
          !CHAIN_IDS.includes(chainIdFromMetamask)
        ) {
          // disconnectWallet()
        } else {
          walletConnectedRef.current = 'METAMASK'
        }
      } else if (isWalletConnectActive) {
        if (
          !(chainIdFromWalletConnect == null) &&
          !CHAIN_IDS.includes(chainIdFromWalletConnect)
        ) {
          // disconnectWallet()
        } else {
          walletConnectedRef.current = 'WALLET_CONNECT'
        }
      }
    }
  }, [
    chainIdFromMetamask,
    isMetamaskActive,
    // disconnectWallet,
    chainIdFromWalletConnect,
    isWalletConnectActive,
  ])

  React.useEffect(() => {
    if (isMetamaskActive) {
      walletConnectedRef.current = 'METAMASK'
      // if (!(chainIdFromMetamask == null)) {
      //   if (CHAIN_IDS.includes(chainIdFromMetamask)) {
      //     setError(null)
      //   } else {
      //     setError(errorsMapping.UnsupportedChainIdError)
      //   }
      // }
    } else if (isWalletConnectActive) {
      walletConnectedRef.current = 'WALLET_CONNECT'
      // if (!(chainIdFromWalletConnect == null)) {
      //   if (CHAIN_IDS.includes(chainIdFromWalletConnect)) {
      //     setError(null)
      //   } else {
      //     setError(errorsMapping.UnsupportedChainIdError)
      //   }
      // }
    }
  }, [
    isMetamaskActive,
    // chainIdFromMetamask,
    // chainIdFromWalletConnect,
    isWalletConnectActive,
  ])

  const formatBalance = (balance) => {
    return !(balance == null)
      ? `${balance} ${CURRENCY?.[web3?.chainId] ?? ''}`
      : ''
  }

  function waitTransactionToConfirm(txnHash) {
    const interval = DEFAULT_INTERVAL
    const blocksToWait = DEFAULT_BLOCKS_TO_WAIT
    var transactionReceiptAsync = async function (txnHash, resolve, reject) {
      try {
        var receipt = library?.eth?.getTransactionReceipt(txnHash)
        if (!receipt) {
          setTimeout(function () {
            transactionReceiptAsync(txnHash, resolve, reject)
          }, interval)
        } else {
          if (blocksToWait > 0) {
            var resolvedReceipt = await receipt
            if (!resolvedReceipt || !resolvedReceipt.blockNumber)
              setTimeout(function () {
                transactionReceiptAsync(txnHash, resolve, reject)
              }, interval)
            else {
              try {
                var block = await library?.eth.getBlock(
                  resolvedReceipt.blockNumber
                )
                var current = await library?.eth.getBlock('latest')
                if (current.number - block.number >= blocksToWait) {
                  var txn = await library?.eth.getTransaction(txnHash)
                  if (txn.blockNumber != null) resolve(resolvedReceipt)
                  else
                    reject(
                      new Error(
                        'Transaction with hash: ' +
                          txnHash +
                          ' ended up in an uncle block.'
                      )
                    )
                } else
                  setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject)
                  }, interval)
              } catch (e) {
                setTimeout(function () {
                  transactionReceiptAsync(txnHash, resolve, reject)
                }, interval)
              }
            }
          } else resolve(receipt)
        }
      } catch (e) {
        reject(e)
      }
    }

    // Resolve multiple transactions once
    if (Array.isArray(txnHash)) {
      var promises = []
      txnHash.forEach(function (oneTxHash) {
        promises.push(waitTransactionToConfirm(oneTxHash))
      })
      return Promise.all(promises)
    } else {
      return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject)
      })
    }
  }

  const signTypedDataForVoucher = React.useCallback(
    ({ domain, types, message, from, primaryType = 'NFTVoucher' }) => {
      const _connector = walletConnectedRef.current
      return new Promise((resolve, reject) =>
        library.currentProvider.sendAsync(
          {
            method: 'eth_signTypedData_v4',
            params: [
              from,
              JSON.stringify({
                domain,
                types,
                message,
                primaryType,
              }),
            ],
            from: from,
          },
          function (err, result) {
            if (err) return reject(err)
            if (result.error) {
              return reject(result.error)
            }
            resolve(_connector === 'METAMASK' ? result.result : result)
          }
        )
      )
    },
    [library]
  )

  React.useEffect(() => {
    if (typeof isValidChainID === 'boolean') {
      setError(isValidChainID ? null : errorsMapping.UnsupportedChainIdError)
    }
  }, [isValidChainID])

  return {
    ...web3,
    account: error == null ? web3?.account : null,
    accounts: error == null ? web3?.accounts : [],
    library: error == null ? library : null,
    error: web3.isActive ? error : null,
    active: web3.isActive,
    custom: {
      isLoading: isLoading || web3.isActivating,
      connectMetamask,
      connectWalletConnect,
      disconnectWallet,
      formatBalance,
      waitTransactionToConfirm,
      signTypedDataForVoucher,
      connectorName,
      isValidChainID,
    },
  }
}
