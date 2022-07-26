import React from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'

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
      verifyBeforeClaimingNFTFromAuctionEVM: {
        success: true,
        message: null,
        data: {
          id: '5',
          signature:
            '0xc048126c71ddab7aa9200ad6bd893e38447ea41840c898e206675b1024e66b426cdcd04876d21a9578b45ae7bfc3ca830e2de275ad8adcaae16237325154202d1c',
          voucher: {
            tokenId: 1,
            tokenURI:
              'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
            isForSale: true,
            isRedeem: true,
            isAuction: true,
            price: '900000000000000000',
            startDate: '1658849764000',
            endDate: '1658850904000',
            target: '0x6907Af89C3DF4E885820AC19751e63DE2699D9bC',
          },
        },
      },
    },
  }
  const redeemToken = async () => {
    try {
      setIsLoading(true)
      setError('')

      // We need to verify with backend before buying any item
      //   await verifyBeforeClaimingNFTFromAuctionEVM({variables:{postId: 10}})
      //   This will provide the voucher and signature that we need to use to redeem the token

      const voucher = data?.verifyBeforeClaimingNFTFromAuctionEVM?.data?.voucher
      const signature =
        data?.verifyBeforeClaimingNFTFromAuctionEVM?.data?.signature

      console.log({
        ...voucher,
        signature,
      })

      const transaction = await contract?.methods
        ?.redeemToken({
          ...voucher,
          signature,
        })
        .send({
          from: account,
          value: voucher.price,
        })

      const _receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )

      console.log('----', _receipt)

      // Confirm with server confirmNFTClaimFromAuctionEVM(postId, transaction_hash)

      // else throw error
    } catch (error) {
      console.log('Redeem Error', error)
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
            <strong>Claim NFT Item</strong>
          </h4>

          <pre>
            {JSON.stringify(
              data?.verifyBeforeClaimingNFTFromAuctionEVM?.data,
              null,
              2
            )}
          </pre>
          {isLoading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden ">Loading...</span>
            </Spinner>
          ) : (
            <Button className="my-4" onClick={redeemToken} disabled={isLoading}>
              Claim
            </Button>
          )}

          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
