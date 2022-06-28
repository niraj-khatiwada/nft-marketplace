import React from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useMutation } from 'react-query'

import useContract from '../../hooks/useContract'
import useWeb3 from '../../hooks/useWeb3'

export default function BuyNFT({ item, onSuccess = () => null }) {
  const { contract, contractAddress } = useContract()
  const {
    library,
    account,
    custom: { waitTransactionToConfirm },
  } = useWeb3()

  const { mutate, isLoading, isError } = useMutation(
    async () => {
      // // TODO: Get signature request from backend
      const signature = await library?.eth?.personal?.sign(
        JSON.stringify({ contract: contractAddress }),
        account
      )
      // // TODO: Verify this signature with backend
      console.log('Signature', signature)
      const transaction = await contract?.methods?.buyNFT(item?.tokenId).send({
        from: account,
        value: item?.price,
      })
      const receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )
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
