import React from 'react'
import { Nav, Button, Spinner } from 'react-bootstrap'
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
import useContract from '../../hooks/useContract'
import AdminFunctionalities from './AdminFunctionalities'
import useContractOwner from '../../hooks/useContractOwner'

export default function Profile() {
  const location = useLocation()
  const { data } = useNFTItemCountUtilityByUser()
  const { data: contractOwner } = useContractOwner()
  const { account } = useWeb3()

  const current = location.hash || '#owned'

  const renderItems = React.useMemo(() => {
    switch (current) {
      case '#for-sale':
        return <ForSale />
      case '#sold':
        return <Sold />
      case '#not-for-sale':
        return <NotForSale />
      case '#created':
        return <Created />
      default:
        return <Owned />
    }
  }, [current])

  return (
    <div>
      <Navbar />
      <section className="my-5">
        {/* AdminFunctionalities: This will not go in the fronted. Only for testing purpose */}
        {contractOwner == account ? <AdminFunctionalities /> : null}{' '}
        <Nav justify variant="tabs">
          <Nav.Item>
            <Nav.Link href="/profile#owned" active={current === '#owned'}>
              Owned {data == null ? '' : `(${data?.[1] ?? 0})`}
              {/* Index 1 = Items Owned */}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#for-sale" active={current === '#for-sale'}>
              For Sale {data == null ? '' : `(${data?.[2] ?? 0})`}
              {/* Index 1 = Items for sale */}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#sold" active={current === '#sold'}>
              Sold {data == null ? '' : `(${data?.[3] ?? 0})`}
              {/* Index 1 = Items Sold */}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              href="/profile#not-for-sale"
              active={current === '#not-for-sale'}
            >
              Not For Sale{' '}
              {data == null ? '' : `(${data?.[1] - data?.[2] ?? 0})`}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#created" active={current === '#created'}>
              Created {data == null ? '' : `(${data?.[0] ?? 0})`}
              {/* Index 1 = Items Created */}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </section>
      <section className="m-4">{renderItems}</section>
    </div>
  )
}

export function NFTItem({ item = null, updateItems = () => null }) {
  const {
    account,
    library,
    custom: { formatBalance, waitTransactionToConfirm },
  } = useWeb3()
  const { contract, contractAddress } = useContract()

  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleNFTBurn = async (tokenId) => {
    /*
    - If the item is lazy minted, we dont have to call any methods from from smart contract since that item has not even entered the contract. So we just call deleteNFTEvm(postId, is_lazy: true).
    - But if its not lazy minted, then we need to call the burnToken first from the contract and then confirm with deleteNFTEvm(postId, is_lazy: false, transaction_hash: '...')
    */
    try {
      setIsLoading(true)
      setError('')

      const transaction = await contract?.methods?.burnToken(+tokenId).send({
        from: account,
      })

      const _receipt = await waitTransactionToConfirm(
        transaction?.transactionHash
      )
      console.log('---', _receipt)
    } catch (error) {
      setError('Something went wrong...')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`card me-2 mb-2 p-4 ${styles['nft-item']}`}
      key={item?.tokenId}
    >
      <p>TokenID: {item?.tokenId ?? ''}</p>
      <p>Creator: {item?.creator ?? ''}</p>
      <p>Owner: {item?.owner ?? ''}</p>
      <p>
        Price:{' '}
        {item?.price == null
          ? ''
          : formatBalance(library?.utils?.fromWei(item?.price, 'ether'))}
      </p>
      <p>Is For Sale: {`${item?.isForSale}` ?? 'false'}</p>
      {item?.owner == account ? (
        <>
          <SaleStatus item={item} onSuccess={updateItems} />
          {isLoading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden ">Loading...</span>
            </Spinner>
          ) : (
            <Button
              onClick={handleNFTBurn.bind(null, item?.tokenId)}
              className="mt-4 bg-danger"
            >
              Burn NFT
            </Button>
          )}
        </>
      ) : null}{' '}
      {error?.length > 0 ? <p className="text-danger">{error}</p> : null}
    </div>
  )
}

function SaleStatus({ item = null, onSuccess = () => null }) {
  const {
    library,
    account,
    custom: { waitTransactionToConfirm },
  } = useWeb3()
  const { contract, contractAddress } = useContract()

  const [newPrice, setNewPrice] = React.useState(
    item?.price == null ? 0 : library?.utils?.fromWei(item?.price, 'ether')
  )

  const { mutate, isLoading, isError } = useMutation(
    async () => {
      const transaction = await contract?.methods
        ?.changeNFTSaleStatus(
          item?.tokenId,
          library?.utils?.toWei(newPrice, 'ether'),
          !item?.isForSale
        )
        .send({
          from: account,
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
      {!item?.isForSale ? (
        <div>
          <label htmlFor="newPrice">New Price: </label>{' '}
          <input
            value={newPrice}
            onChange={(evt) =>
              !isNaN(evt?.target?.value) && setNewPrice(evt?.target?.value)
            }
            is="newPrice"
          />
        </div>
      ) : null}

      <Button
        className={`my-2 bg-${!item?.isForSale ? 'success' : 'danger'}`}
        onClick={mutate}
      >
        {item?.isForSale ? 'Set as Not For Sale' : 'Set as For Sale'}
      </Button>
      {isError ? <p className="text-danger">Something went wrong...</p> : null}
    </>
  )
}
