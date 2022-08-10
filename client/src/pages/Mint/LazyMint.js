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

    custom: { signTypedDataForVoucher },
  } = useWeb3()
  const { contract, contractAddress } = useContract()
  const { chainId } = useNetwork()

  const [error, setError] = React.useState('')

  const voucher = {
    isAuction: false,
    isForSale: true,
    isRedeem: true,
    price: '100000000000000',
    target: '0x8af64d0B00D8243E2555d9322DD077100E90e717',
    tokenId: 2,
    tokenURI: 'bafkreiew6uequavjrck3za5shdlnirxwlt7ye5ybkdadwokczw4tnewzae',
    startDate: '0',
    endDate: '0',
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

      console.log('---lazy')

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
            <strong>Lazy Mint</strong>
          </h4>

          <pre>{JSON.stringify(voucher, null, 2)}</pre>
          {voucher.isAuction ? (
            <h5>
              Starts in {getDateFromNow(new Date(+voucher.startDate))}
              {' | '}
              {formatDate(new Date(+voucher.startDate))}
            </h5>
          ) : null}

          <Button className="my-4" onClick={mintToken}>
            Mint
          </Button>
          {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
        </div>
      ) : null}
    </>
  )
}

// 0xdb98a81244DfA478273d9Ff89fE773A81D4c4778
