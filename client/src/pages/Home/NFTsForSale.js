import React from 'react'
import { Spinner } from 'react-bootstrap'

import styles from './style.module.css'
import useWeb3 from '../../hooks/useWeb3'
import useNFTItemsForSale from '../../hooks/useNFTItemsForSale'
import BuyNFT from './BuyNFT'

function NFTsForSale() {
  const {
    account,
    library,
    custom: { formatBalance },
  } = useWeb3()

  const { data, isLoading, isError, refetch } = useNFTItemsForSale()

  const onSuccess = () => {
    refetch()
  }

  return (
    <>
      {account?.length ? (
        <div className="mx-5 my-3 d-flex flex-wrap">
          {Array.isArray(data) ? (
            data?.length > 0 ? (
              data?.map((item) => (
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
                      : formatBalance(
                          library?.utils?.fromWei(item?.price, 'ether')
                        )}
                  </p>
                  <p>Is For Sale: {`${item?.isForSale}` ?? 'false'}</p>

                  {item?.owner == account ? (
                    <p
                      className="bg-success px-2"
                      style={{ width: 'fit-content' }}
                    >
                      {' '}
                      My Item{' '}
                    </p>
                  ) : item?.creator !== account ? (
                    <BuyNFT item={item} onSuccess={onSuccess} />
                  ) : null}
                </div>
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

export default NFTsForSale
