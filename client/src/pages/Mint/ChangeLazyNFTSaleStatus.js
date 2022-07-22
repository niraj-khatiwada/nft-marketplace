import React from 'react'
import { Button } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'
import VoucherService from './VoucherService'

const voucher = {
  isAuction: false,
  isForSale: true,
  isRedeem: true,
  price: '3000000000000000',
  target: '0x9859C69D69E0F3AB2D8826dc73764D0DC5f050D4',
  tokenId: 5,
  startDate: '0',
  endDate: '0',
  tokenURI: 'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
}

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
  const [newPrice, setNewPrice] = React.useState(null)

  const changeSaleStatus = async () => {
    try {
      setError('')

      const voucherService = new VoucherService(
        contract,
        contractAddress,
        chainId
      )
      const voucherParams = await voucherService.createVoucherParams(
        voucher.isForSale
          ? { ...voucher, price: library?.utils?.toWei(newPrice?.toString()) }
          : voucher
      )
      const signature = await signTypedDataForVoucher({
        domain: voucherParams.domain,
        types: voucherParams.types,
        message: voucherParams.message,
        from: account,
      })

      // confirm the post with backend directly now

      console.log(signature, JSON.stringify(voucherParams, null, 4))

      // Call this graphql mutation for backend confirmation
      // Base64 encode message

      // const {data} =  await confirmNFTSaleStatusChange({message: btoa(JSON.stringify(voucherParams.message)), signature})

      // isSuccess = data?.confirmPostEVM?.success

      // If success go to post details
      // else throw error
    } catch (error) {
      console.log('Change Sale Status Error', error)
      setError('Something went wrong...')
    }
  }

  const handlePriceChange = (evt) => {
    const newPrice = evt?.target?.value
    if (!(newPrice == null) && !isNaN(+newPrice)) {
      if (newPrice?.includes('.') && newPrice?.split('.')?.[1]?.length <= 3) {
        setNewPrice(+newPrice)
      }
    }
  }

  React.useEffect(() => {
    if (!(library == null) && newPrice == null) {
      setNewPrice(library?.utils?.fromWei(voucher.price))
    }
  }, [library])

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="m-3">
          <h4 className="text-dark">
            <strong>Change Sale Status</strong>
          </h4>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>

          {voucher.isForSale ? (
            <div className="d-flex flex-column w-25">
              <label htmlFor="newPrice">New Price(ETH)</label>
              <input
                type="number"
                id="newPrice"
                value={newPrice ?? 0}
                onChange={handlePriceChange}
              />
            </div>
          ) : null}

          <Button className="my-4" onClick={changeSaleStatus}>
            Sign
          </Button>
          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
