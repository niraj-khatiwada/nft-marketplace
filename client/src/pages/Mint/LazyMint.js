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
    price: '3000000000000000',
    target: '0x36C10991DFf0ea1ea2e2982D4e840c2B0544cE2c',
    tokenId: 2,
    tokenURI: 'bafkreighhoaeph2kbsnzpxv3z7qfsfsvaguh7l3re6y4vxt7epkx6qgulq',
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

      console.log('---', voucherParams)

      const signature = await signTypedDataForVoucher({
        domain: voucherParams.domain,
        types: voucherParams.types,
        message: voucherParams.message,
        from: account,
      })

      // confirm the post with backend directly now

      console.log(signature, JSON.stringify(voucherParams.message, null, 2))

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
