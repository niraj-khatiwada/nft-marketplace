import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'

import { Button } from 'react-bootstrap'
import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import NFTsForSale from './NFTsForSale'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'

function Home() {
  const { account } = useWeb3()

  return (
    <>
      <Navbar />
      {account?.length ? (
        <>
          <div className="mx-5 my-3 d-flex flex-column align-items-start">
            <Button as={Link} to="/lazy-mint" className="mt-4 ">
              Lazy Mint new NFT
            </Button>
            <Button as={Link} to="/buy-lazy-nft" className="mt-4 bg-info">
              Buy Lazy Minted NFT
            </Button>
            <Button as={Link} to="/buy-nft" className="mt-4 bg-success">
              Buy Fully Minted NFT
            </Button>
            <Button
              as={Link}
              to="/restore-lazy-nft"
              className="mt-4 bg-warning"
            >
              Restore Lazy Minted NFT
            </Button>
            <Button
              as={Link}
              to="/change-lazy-sale-status"
              className="mt-4 bg-primary"
            >
              Change Lazy NFT Sale Status
            </Button>
            <Button as={Link} to="/bid" className="mt-4 bg-primary">
              Bid on Item
            </Button>
            <Button
              as={Link}
              to="/sign-bid-acceptance"
              className="mt-4 bg-primary"
            >
              Accept Bid
            </Button>
            <Button
              as={Link}
              to="/claim-auction-item"
              className="mt-4 bg-primary"
            >
              Claim Auction Item
            </Button>
          </div>
          <NFTsForSale />
        </>
      ) : null}
    </>
  )
}

export default Home
