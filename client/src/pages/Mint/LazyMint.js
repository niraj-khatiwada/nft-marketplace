import React from 'react'
import { Button } from 'react-bootstrap'
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

  const [tokenId, setTokenId] = React.useState() // Token id will be returned along with post id.
  const [price, setPrice] = React.useState() // Price is what the user set

  const [tokenURI, setTokenURI] = React.useState(
    'bafkreifs7mbxapo4aei3k66mk6s75oitvs3tkakiugonytlrcau3dwyw6u'
  ) //  This will be returned along with post id.

  const mintToken = async () => {
    try {
      setError('')

      // const voucher = {
      //   isAuction: false,
      //   isForSale: true,
      //   isRedeem: false,
      //   price: library?.utils?.toWei(price, 'ether'),
      //   target: account,
      //   tokenId: +tokenId,
      //   tokenURI: tokenURI,
      // }

      // // For example
      const voucher = {
        isAuction: false,
        isForSale: true,
        isRedeem: true,
        price: '3000000000000000',
        target: '0x9859C69D69E0F3AB2D8826dc73764D0DC5f050D4',
        tokenId: 1,
        tokenURI: 'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
      }

      const voucherService = new VoucherService(
        contract,
        contractAddress,
        chainId
      )
      const voucherParams = await voucherService.createVoucherParams(voucher)
      const signature = await signTypedDataForVoucher({
        domain: voucherParams.domain,
        types: voucherParams.types,
        message: voucherParams.message,
        from: account,
      })

      // confirm the post with backend directly now

      console.log(signature, JSON.stringify(voucherParams, null, 2))

      // Call this graphql mutation for backend confirmation
      // Base64 encode message

      // const {data} =  await confirmPostEVM({message: btoa(JSON.stringify(voucherParams.message)), signature})

      // isSuccess = data?.confirmPostEVM?.success

      // If success go to post details
      // else throw error
    } catch (error) {
      console.log('Mint Error', error)
      setError('Something went wrong...')
    }
  }

  const isDisabled = tokenURI?.trim()?.length == 0 || tokenId == null

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="m-3">
          <h4 className="text-dark">
            <strong>Lazy Mint</strong>
          </h4>

          <div>
            <div className="my-2">
              <label>Token Id: </label>
              <input
                className="mx-2"
                type="number"
                value={tokenId}
                step={1}
                onChange={(evt) =>
                  !isNaN(evt?.target?.value) && setTokenId(evt?.target?.value)
                }
              />
            </div>

            <div className="my-2">
              <label>Token URI: </label>
              <input
                className="mx-2 w-75"
                value={tokenURI}
                onChange={(evt) => setTokenURI(evt?.target?.value)}
              />
            </div>
            <div className="my-2">
              <label>Price: </label>
              <input
                className="mx-2"
                value={price}
                onChange={(evt) =>
                  !isNaN(evt?.target?.value) && setPrice(evt?.target?.value)
                }
              />
            </div>
          </div>
          <Button className="my-4" onClick={mintToken} disabled={isDisabled}>
            Mint
          </Button>
          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
