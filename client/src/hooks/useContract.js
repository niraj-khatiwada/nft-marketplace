import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { useQuery } from 'react-query'

// const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS
const TOKEN_CONTRACT_ADDRESS = '0x6E5E4d5005e10632bd077f83975Ff0DC54e16795'

export default function useContract() {
  const { library } = useWeb3React()

  const getContract = React.useCallback(async () => {
    if (library?.eth?.Contract) {
      const contractJson = await fetch('/contracts/NFTMarketplace.json')
      const artifacts = await contractJson.json()
      const contract = new library.eth.Contract(
        artifacts.abi,
        TOKEN_CONTRACT_ADDRESS
      )
      return contract
    }
    return null
  }, [library])

  const { isLoading, data, isError, error } = useQuery(
    'getContract',
    getContract,
    {
      enabled: !(library == null),
    }
  )

  return {
    contractAddress: TOKEN_CONTRACT_ADDRESS,
    contract: data,
    isLoading,
    isError,
    error,
  }
}
