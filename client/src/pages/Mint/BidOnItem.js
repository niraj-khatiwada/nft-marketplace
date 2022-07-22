import React from 'react'
import { Button } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'
import VoucherService from './VoucherService'
import { getDateFromNow, formatDate } from '../../helpers/datetime'

export default function Home() {
  const {
    account,
    library,
    custom: { signTypedDataForVoucher },
  } = useWeb3()
  const { contract, contractAddress } = useContract()
  const { chainId } = useNetwork()
  const history = useHistory()

  const [error, setError] = React.useState('')

  const voucher = {
    tokenId: 8,
    startDate: '1658421842000',
    endDate: '1658771042000',
    amount: '3300000000000000',
    timestamp: '1658513626181',
  }

  const mintToken = async () => {
    try {
      setError('')

      const voucherService = new VoucherService(
        contract,
        contractAddress,
        chainId
      )
      const voucherParams = await voucherService.createBidVoucherParams(voucher)
      const signature = await signTypedDataForVoucher({
        domain: voucherParams.domain,
        types: voucherParams.types,
        message: voucherParams.message,
        from: account,
        primaryType: 'BidVoucher',
      })

      // confirm the post with backend directly now

      console.log(signature, JSON.stringify(voucherParams, null, 4))

      // Call this graphql mutation for backend confirmation
      // Base64 encode message

      // const {data} =  await confirmBidOnItemEVM({message: btoa(JSON.stringify(voucherParams.message)), signature})

      // isSuccess = data?.confirmPostEVM?.success
    } catch (error) {
      console.log('Mint Error', error)
      setError('Something went wrong...')
    }
  }

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="m-3">
          <h4 className="text-dark">
            <strong>Bid on Item</strong>
          </h4>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>
          <h5>
            Start{+new Date() > +voucher.startDate ? 'ed' : "'s"}{' '}
            {getDateFromNow(new Date(+voucher.startDate))}
            {' | '}
            {formatDate(new Date(+voucher.startDate))}
          </h5>

          <Button className="my-4" onClick={mintToken}>
            Bid
          </Button>
          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
