import React from 'react'
import { useQuery } from 'react-query'

import useWeb3 from './useWeb3'
import { CHAIN } from '../helpers/connectors'

const REACT_APP_TOKEN_CONTRACT_ADDRESS_ETHEREUM =
  process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS_ETHEREUM
const REACT_APP_TOKEN_CONTRACT_ADDRESS_POLYGON =
  process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS_POLYGON

export default function useContract() {
  const { library, chainId } = useWeb3()

  const contractAddress = React.useMemo(
    () =>
      chainId == null
        ? null
        : CHAIN[chainId] === 'ETHEREUM'
        ? REACT_APP_TOKEN_CONTRACT_ADDRESS_ETHEREUM
        : REACT_APP_TOKEN_CONTRACT_ADDRESS_POLYGON,
    [chainId]
  )

  const getContract = React.useCallback(async () => {
    if (library?.eth?.Contract && !(contractAddress == null)) {
      const contractJson = await fetch('/contracts/NFTMarketplace.json')
      const artifacts = await contractJson.json()
      const contract = new library.eth.Contract(artifacts.abi, contractAddress)
      return contract
    }
    return null
  }, [library, contractAddress])

  const { isLoading, data, isError, error } = useQuery(
    'getContract',
    getContract,
    {
      enabled: !(library == null),
    }
  )

  return {
    contractAddress,
    contract: data,
    isLoading,
    isError,
    error,
  }
}
