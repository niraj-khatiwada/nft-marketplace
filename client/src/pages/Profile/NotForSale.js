import React from 'react'
import { Button, Spinner } from 'react-bootstrap'

import styles from './style.module.css'
import useNFTItemsNotForSaleByUser from '../../hooks/useNFTItemsNotForSaleByUser'
import useWeb3 from '../../hooks/useWeb3'
import { NFTItem } from '.'

export default function Owned() {
  const {
    account,
    library,
    custom: { formatBalance },
  } = useWeb3()

  const { data, isLoading, isError, refetch } = useNFTItemsNotForSaleByUser()

  return (
    <>
      {account?.length ? (
        <div className="mx-5 my-3 d-flex flex-wrap">
          {Array.isArray(data) ? (
            data?.length > 0 ? (
              data?.map((item) => (
                <NFTItem
                  item={item}
                  key={item?.tokenId}
                  updateItems={refetch}
                />
              ))
            ) : (
              <p>Empty</p>
            )
          ) : isLoading ? (
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden ">Loading...</span>
            </Spinner>
          ) : isError ? (
            <p>Something went wrong...</p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
