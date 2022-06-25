import React from 'react'
import { Link } from 'react-router-dom'

import { Button } from 'react-bootstrap'
import Navbar from '../../components/Navbar'
import useBalance from '../../hooks/useBalance'
import useWeb3 from '../../hooks/useWeb3'
import useContract from '../../hooks/useContract'

function Home() {
  const { account } = useWeb3()
  const { contract } = useContract()
  const { formatted } = useBalance()

  const getAllNFTS = async () => {
    try {
      const response = await contract?.methods?.nftItemsCount().call()
      console.log(response)
    } catch (error) {}
  }

  console.log(contract)

  getAllNFTS()

  return (
    <>
      <Navbar />
      {account?.length ? (
        <div className="mx-5 my-3">
          <p className="text-dark">Balance: {formatted}</p>
          <Button as={Link} to="/mint">
            Mint NFT
          </Button>
        </div>
      ) : null}
    </>
  )
}

export default Home
