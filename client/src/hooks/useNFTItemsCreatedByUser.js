import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemsCreated() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getItemsByCreator = React.useCallback(
    async () => contract?.methods?.getItemsByUser(account, 1).call(),
    [contract, account]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getItemsByCreator',
    getItemsByCreator,
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
