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

  // Voucher is returned from API, see below
  const voucher = {
    tokenId: 1,
    tokenURI: 'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
    price: '3000000000000000',
    isForSale: true,
    isAuction: false,
    target: '0x36C10991DFf0ea1ea2e2982D4e840c2B0544cE2c',
    isRedeem: true,
    startDate: '0',
    endDate: '0',
  }

  const mintToken = async () => {
    try {
      setIsLoading(true)
      setError('')

      // We need to verify with backend before buying any item
      //   await verifyNFTBeforeRestoringToWalletEVM({variables:{postId: 10}})

      // If this is lazy minted item, it will return you the voucher that you can use to mint the item

      /* 
        {
  "data": {
    "verifyNFTBeforeRestoringToWalletEVM": {
      "success": true,
      "message": null,
      "data": {
        "id": "48",
        "token_id": 2,
        "signature": "0x6159f3b706b1b1a35b47bb08b39aa4e463ab1474d4cde4c53b5b8892ac056043677ecf4de62f633b893c8ae7ea8fb6fdfd5bffce9b06199c160825f07068d9191b",
        "voucher": {
          "tokenId": 2,
          "tokenURI": "bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4",
          "price": "3000000000000000",
          "isForSale": true,
          "isRedeem": true,
          "isAuction": false,
          "target": "0x9859C69D69E0F3AB2D8826dc73764D0DC5f050D4"
        }
      }
    }
  }
}
      */

      const signature =
        '0x3e184222e68fdbac2b427831250f28dd662d7eff6d13babb03e92e2f2d9951ce329ceb122fa26b50eaffecc01c837463d7de4b8457bfda05f421539b9b1671851c'

      const transaction = await contract?.methods
        ?.mintToken({
          ...voucher,
          signature: signature,
        })
        .send({
          from: account,
        })

      const _receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )
      setReceipt(_receipt)
      console.log('---', _receipt)

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
            <strong>Restore Lazy Minted NFT</strong>
          </h4>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>
          {isLoading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden ">Loading...</span>
            </Spinner>
          ) : (
            <Button className="my-4" onClick={mintToken} disabled={isLoading}>
              Restore
            </Button>
          )}

          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
