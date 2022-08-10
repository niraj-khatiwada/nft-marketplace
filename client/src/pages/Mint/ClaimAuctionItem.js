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
          id: '9',
          signature:
            '0x9e0a87728c5c5aa3d128d6c00dd1fe287aea0fa71e74dc0df05f76bacb253c144ea22f767b36ab89418073f5cefabdc33ffa65df088216b65b309d8a2e85733d1c',
          voucher: {
            tokenId: 2,
            tokenURI:
              'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
            isForSale: true,
            isRedeem: true,
            isAuction: true,
            price: '800000000000000000',
            startDate: '1658860619000',
            endDate: '1658861159000',
            target: '0x8F022D290F1DD3e0e5f1eABC215FF639BF7c0Ac4',
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
