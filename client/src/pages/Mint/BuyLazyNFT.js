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

  const voucher = {
    isRedeem: true,
    isAuction: false,
    isForSale: true,
    price: '10000000000000000',
    target: '0x8af64d0B00D8243E2555d9322DD077100E90e717',
    tokenId: 1,
    tokenURI: 'bafkreiclh6yc55vj3vne4capxscufl7mvycrynoot224srshnm2gmtd57u',
  }

  const redeemToken = async () => {
    try {
      setIsLoading(true)
      setError('')

      // We need to verify with backend before buying any item
      //   await verifyNFTBeforeBuyingEVM({variables:{postId: 10}})
      //   Now there will be 2 steps, depending upon is_lazy_minted_response returned by verifyNFTBeforeBuyingEVM API. Response will look like below:
      /* 
        {
        "data": {
            "verifyNFTBeforeBuyingEVM": {
            "success": true,
            "message": null,
            "data": {
                "id": "35",
                "is_lazy_minted": true,
                "token_id": 7,
                "signature": "0x819dcb81561b9a089e680a274c8b5fc51803c5a50959ce06a878cc6c21e4136b73d92bbdc1c2b1f20596f9b06f7d899d4fcdbf538a09f5b3388e1c6c0cd2f5391b",
                "voucher": {
                "isRedeem": true,
                "isAuction": false,
                "isForSale": true,
                "price": "1000000000000000000",
                "target": "0x6907Af89C3DF4E885820AC19751e63DE2699D9bC",
                "tokenId": 7
                }
            }
            }
        }
}
      */

      // If is_lazy_minted is true then we need to call redeemToken from contract. It will accept signature and voucher which is both returned from API. If not we need to call buyNFT from contract, it will take token_id directly. I will discuss this buyNFT later, so lets focus on redeemToken first.

      //   Lets assume the API returned is_lazy_minted =  true then the below is an example of voucher returned

      // // For example
      const signature =
        '0x02353abc7be6d511d1a61ccbb9fb74cfd607d77126e91f7a9b57fc3eb6751660583648ec79521af2ed8838ad9cf7d8aee29c169250e6c3bf2e90e2f190385d231b'

      const transaction = await contract?.methods
        ?.redeemToken({
          ...voucher,
          signature: signature,
        })
        .send({
          from: account,
          value: voucher.price,
        })

      const receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )
      console.log('---', receipt)

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
            <strong>Buy Lazy Minted NFT</strong>
          </h4>

          <code style={{ display: 'block', width: '400px' }}>
            {JSON.stringify(voucher, null, 2)}
          </code>
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
