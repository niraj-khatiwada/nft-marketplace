import React from 'react'
import { Button } from 'react-bootstrap'
import { useHistory } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'

export default function Home() {
  const {
    account,
    library,
    custom: { waitTransactionToConfirm },
  } = useWeb3()
  const { contract, contractAddress } = useContract()
  const history = useHistory()

  const [error, setError] = React.useState('')

  const [tokenId, setTokenId] = React.useState() // Token id will be returned along with post id.
  const [price, setPrice] = React.useState() // Price is what the user set

  const [tokenURI, setTokenURI] = React.useState(
    'https://gateway.pinata.cloud/ipfs/bafkreifs7mbxapo4aei3k66mk6s75oitvs3tkakiugonytlrcau3dwyw6u'
  ) //  This will be returned along with post id.

  const mintToken = async () => {
    try {
      setError('')
      // // TODO: Get signature request from backend
      const signature = await library?.eth?.personal?.sign(
        JSON.stringify({ contract: contractAddress }),
        account
      )
      // // TODO: Verify this signature with backend
      console.log('Signature', signature)

      const transaction = await contract?.methods
        ?.mintToken(
          +tokenId,
          tokenURI,
          library?.utils?.toWei(price, 'ether'),
          true // Is for Sale
        )
        .send({
          from: account,
        })

      const receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )
      console.log('---', receipt)
      history.push('/')
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
          <p className="text-dark">
            <strong>Token URI</strong>: {tokenURI}
          </p>

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
