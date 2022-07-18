import React from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'
import VoucherService from './VoucherService'

export default function Home() {
  const {
    account,
    library,
    custom: { waitTransactionToConfirm, signTypedDataForVoucher },
  } = useWeb3()
  const { contract, contractAddress } = useContract()
  const { chainId } = useNetwork()
  const history = useHistory()

  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [receipt, setReceipt] = React.useState(null)

  // Place this below after calling verify. This is just for demo
  const { data } = {
    data: {
      verifyNFTBeforeBuyingEVM: {
        success: true,
        message: null,
        data: {
          id: '50',
          is_lazy_minted: false,
          token_id: 1,
          price: '3000000000000000',
          signature: null,
          voucher: null,
        },
      },
    },
  }

  const redeemToken = async () => {
    try {
      setIsLoading(true)
      setError('')

      // We need to verify with backend before buying any item
      //   await verifyNFTBeforeBuyingEVM({variables:{postId: 10}})
      //   Now there will be 2 steps, depending upon is_lazy_minted_response returned by verifyNFTBeforeBuyingEVM API. Response will look like below:

      const isLazyMinted = data?.verifyNFTBeforeBuyingEVM?.data?.is_lazy_minted
      const tokenId = data?.verifyNFTBeforeBuyingEVM?.data?.token_id
      const price = data?.verifyNFTBeforeBuyingEVM?.data?.price

      // // For example
      if (isLazyMinted) {
        // see ./BuyLazyNFT.js
      } else {
        const transaction = await contract?.methods?.buyNFT(+tokenId).send({
          from: account,
          value: price,
        })

        const _receipt = await waitTransactionToConfirm(
          transaction?.transactionHash
        )
        setReceipt(_receipt)
        console.log('---', _receipt)
      }

      // Confirm with server confirmNFTBuyEVM(postId, transaction_hash)

      // else throw error
    } catch (error) {
      console.log('Buy Error', error)
      setError('Something went wrong...')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="m-3">
          <h4 className="text-dark">
            <strong>Buy Fully Minted NFT</strong>
          </h4>

          <pre>
            {JSON.stringify(data?.verifyNFTBeforeBuyingEVM?.data, null, 2)}
          </pre>
          {isLoading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden ">Loading...</span>
            </Spinner>
          ) : (
            <Button className="my-4" onClick={redeemToken} disabled={isLoading}>
              Buy
            </Button>
          )}

          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
