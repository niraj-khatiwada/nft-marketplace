import React from 'react'
import { useQuery } from 'react-query'

import useWeb3 from './useWeb3'

const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS

export default function useContract() {
  const { library } = useWeb3()

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
