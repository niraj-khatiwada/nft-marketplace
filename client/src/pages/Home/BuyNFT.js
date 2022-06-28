import React from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useMutation } from 'react-query'

import useContract from '../../hooks/useContract'
import useWeb3 from '../../hooks/useWeb3'

export default function BuyNFT({ item, onSuccess = () => null }) {
  const { contract } = useContract()
  const {
    account,
    custom: { waitTransaction },
  } = useWeb3()

  const { mutate, isLoading, isError } = useMutation(
    async () => {
      const transaction = await contract?.methods?.buyNFT(item?.tokenId).send({
        from: account,
        value: item?.price,
      })
      const receipt = await waitTransaction(transaction?.transactionHash)
      console.log('---', receipt)
      return receipt
    },
    {
      onSuccess,
      onError: (error) => {
        console.log('---Error', { error }, error)
      },
    }
  )

  return isLoading ? (
    <Spinner animation="border" role="status" variant="primary">
      <span className="visually-hidden ">Loading...</span>
    </Spinner>
  ) : (
    <>
      <Button onClick={mutate}> Buy NFT</Button>

      {isError ? <p className="text-danger">Something went wrong...</p> : null}
    </>
  )
}
