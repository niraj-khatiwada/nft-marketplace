// @ts-check
import React from 'react'
import { useWeb3React } from '@web3-react/core'

import {
  injected,
  walletconnect,
  resetWalletConnector,
} from '../helpers/connectors'
import { CURRENCY } from '../helpers/connectors'

const DEFAULT_INTERVAL = 500
const DEFAULT_BLOCKS_TO_WAIT = 0

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
        var receipt = web3.library?.eth?.getTransactionReceipt(txnHash)
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
                var block = await web3.library?.eth.getBlock(
                  resolvedReceipt.blockNumber
                )
                var current = await web3.library?.eth.getBlock('latest')
                if (current.number - block.number >= blocksToWait) {
                  var txn = await web3.library?.eth.getTransaction(txnHash)
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

  function signTypedDataForVoucher({ domain, types, message, from }) {
    return new Promise((resolve, reject) =>
      web3.library?.currentProvider?.send(
        {
          method: 'eth_signTypedData_v4',
          params: [
            from,
            JSON.stringify({
              domain,
              types,
              message,
              primaryType: 'NFTVoucher',
            }),
          ],
          from: from,
        },
        function (err, result) {
          if (err) return reject(err)
          if (result.error) {
            return reject(result.error)
          }
          resolve(result.result)
        }
      )
    )
  }

  return {
    ...web3,
    custom: {
      isLoading,
      connectMetamask,
      connectWalletConnect,
      disconnectWallet,
      formatBalance,
      waitTransactionToConfirm,
      signTypedDataForVoucher,
    },
  }
}
