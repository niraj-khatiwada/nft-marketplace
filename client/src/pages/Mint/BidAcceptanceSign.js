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
    custom: { waitTransactionToConfirm, signTypedDataForVoucher },
  } = useWeb3()
  const { contract, contractAddress } = useContract()
  const { chainId } = useNetwork()
  const history = useHistory()

  const [error, setError] = React.useState('')

  const voucher = {
    tokenId: 2,
    tokenURI: 'bafkreiclg55rpej4ngu2ms5obwtlo7cmbjqerhtgi5umjxbgsmqhrt6rl4',
    isForSale: true,
    isRedeem: true,
    isAuction: true,
    price: '800000000000000000',
    startDate: '1658860619000',
    endDate: '1658861159000',
    target: '0x8F022D290F1DD3e0e5f1eABC215FF639BF7c0Ac4',
  }
  const mintToken = async () => {
    try {
      setError('')

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

      console.log(signature, JSON.stringify(voucherParams, null, 4))

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

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="m-3">
          <h4 className="text-dark">
            <strong>Sign Bid Acceptance</strong>
          </h4>
          <p>This needs to be signed by the auction creator</p>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>

          <Button className="my-4" onClick={mintToken}>
            Accept
          </Button>
          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}
