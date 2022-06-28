import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemsOwned() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getItemsByOwner = React.useCallback(
    async () => contract?.methods?.getItemsByOwner(account).call(),
    [contract, account]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getItemsByOwner',
    getItemsByOwner,
    {
      enabled: !(contract == null),
    }
  )

  return {
    isLoading,
    data,
    isError,
    error,
    refetch,
  }
}
