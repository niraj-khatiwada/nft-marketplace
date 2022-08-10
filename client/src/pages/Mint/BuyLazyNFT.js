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

  const voucher = {
    isRedeem: true,
    isAuction: false,
    isForSale: true,
    price: '10000000000000000',
    tokenId: 69,
    target: '0x4f2FD14488F070fd57eAe413149a7B9FE29Ce776',
    startDate: '0',
    endDate: '0',
    tokenURI: 'bafkreidp4z5ddp7co7tzkz52vbkgohxj4v3uz66nhjnhdv7dyoamle6kyu',
  }

  const redeemToken = async () => {
    try {
      setIsLoading(true)
      setError('')

      // We need to verify with backend before buying any item
      //   await verifyNFTBeforeBuyingEVM({variables:{postId: 10}})
      //   Now there will be 2 steps, depending upon is_lazy_minted_response returned by verifyNFTBeforeBuyingEVM API. Response will look like below:

      const { data } = {
        data: {
          verifyNFTBeforeBuyingEVM: {
            success: true,
            message: null,
            data: {
              id: '58',
              is_lazy_minted: true,
              token_id: 5,
              signature:
                '0xb3c0c7e2df9576f0308f8c512d097f1d7259bf75660c984dea26ac1386666c10245212acb60c8c0b9dc3cb38a3dcdb41284cde729c8b5a9200bb823b9646196f1c',
              price: null,
              voucher: {
                isRedeem: true,
                isAuction: false,
                isForSale: true,
                price: '3000000000000000',
                target: '0x9859C69D69E0F3AB2D8826dc73764D0DC5f050D4',
                tokenId: 5,
                tokenURI:
                  'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
              },
            },
          },
        },
      }

      // If is_lazy_minted is true then we need to call redeemToken from contract. It will accept signature and voucher which is both returned from API. If not we need to call buyNFT from contract, it will take token_id directly.

      //   Lets assume the API returned is_lazy_minted =  true then the below is an example of voucher returned

      const isLazyMinted = data?.verifyNFTBeforeBuyingEVM?.data?.is_lazy_minted

      // // For example
      if (isLazyMinted) {
        const signature =
          '0xb3c0c7e2df9576f0308f8c512d097f1d7259bf75660c984dea26ac1386666c10245212acb60c8c0b9dc3cb38a3dcdb41284cde729c8b5a9200bb823b9646196f1c'

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
      } else {
        // See ./BuyNFTCode
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
            <strong>Buy Lazy Minted NFT</strong>
          </h4>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>
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
