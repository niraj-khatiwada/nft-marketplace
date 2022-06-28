import React from 'react'
import { Nav, Button } from 'react-bootstrap'
import { useLocation } from 'react-router-dom'
import { useMutation } from 'react-query'

import Navbar from '../../components/Navbar'
import Owned from './Owned'
import useNFTItemCountUtilityByUser from '../../hooks/useNFTItemCountUtilityByUser'
import ForSale from './ForSale'
import Sold from './Sold'
import NotForSale from './NotForSale'
import Created from './Created'
import useWeb3 from '../../hooks/useWeb3'
import styles from './style.module.css'
import { Spinner } from 'react-bootstrap'
import useContract from '../../hooks/useContract'
import useServiceCharge from '../../hooks/useServiceCharge'

export default function AdminFunctionalities() {
  return (
    <>
      <ServiceCharge />
    </>
  )
}

function ServiceCharge() {
  const {
    library,
    account,
    custom: { waitTransactionToConfirm },
  } = useWeb3()
  const { contract } = useContract()
  const { data } = useServiceCharge()

  const [newPrice, setNewPrice] = React.useState(0)

  const { mutate, isLoading, isError } = useMutation(async () => {
    const currentCharge = data

    if (currentCharge == newPrice) {
      throw new Error('Service Charge is same')
    }

    const transaction = await contract?.methods
      ?.changeServiceCharge(newPrice * 1000)
      .send({
        from: account,
      })
    const receipt = await waitTransactionToConfirm(transaction?.transactionHash)
    console.log('---', receipt)
    return receipt
  })

  return (
    <>
      <h5 className="px-3">Service Charge in Percentage</h5>
      {!(data == null) ? (
        <p className="text-success px-3">Current Percentage: {data / 1000}%</p>
      ) : null}
      {isLoading ? (
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden ">Loading...</span>
        </Spinner>
      ) : (
        <>
          <div className="px-3">
            <label className="d-block" htmlFor="newPrice">
              New Service Charge(in Percentage):{' '}
            </label>{' '}
            <input
              value={newPrice}
              onChange={(evt) =>
                !isNaN(evt?.target?.value) && setNewPrice(evt?.target?.value)
              }
              is="newPrice"
            />
          </div>

          <Button className="my-2 m-3 mb-4" onClick={mutate}>
            Change Listing Price
          </Button>
          {isError ? (
            <p className="text-danger">Something went wrong...</p>
          ) : null}
        </>
      )}
    </>
  )
}
