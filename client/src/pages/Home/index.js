import React from 'react'
import { Link } from 'react-router-dom'

import { Button } from 'react-bootstrap'
import Navbar from '../../components/Navbar'
import useWeb3 from '../../hooks/useWeb3'
import NFTsForSale from './NFTsForSale'
import useContract from '../../hooks/useContract'
import useNetwork from '../../hooks/useNetwork'

function Home() {
  const { account, library } = useWeb3()

  const { contract, contractAddress } = useContract()

  return (
    <>
      <Navbar />
      {account?.length ? (
        <>
          <div className="mx-5 my-3">
            <Button as={Link} to="/mint">
              Mint new NFT
            </Button>
          </div>
          <NFTsForSale />
        </>
      ) : null}
    </>
  )
}

export default Home
