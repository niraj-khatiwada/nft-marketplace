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

  const voucher = {
    isRedeem: true,
    isAuction: false,
    isForSale: true,
    price: '50000000000000000',
    target: '0x36C10991DFf0ea1ea2e2982D4e840c2B0544cE2c',
    tokenId: 4,
    tokenURI: 'bafkreig5htoszduyx2oas2n6a5jqtqjza7y43tubcirzxcpy4hlffhjcfm',
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
      if (receipt == null) {
        const signature =
          '0xc11436441fbeed8d51fae4fc4e3e3ffed30a999f677f3eb348a08374ff0e0e7b5de15eebfeff838ce9ab434537adcc8d4ef2a7155f9b6c8ce9b626e073ce71771b'

        const transaction = await contract?.methods
          ?.redeemToken({
            ...voucher,
            signature: signature,
          })
          .send({
            from: account,
            value: voucher.price,
          })

        const _receipt = await waitTransactionToConfirm(
          transaction?.transactionHash
        )
        setReceipt(_receipt)
        console.log('---', _receipt)
      }
      // Confirm with server

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
