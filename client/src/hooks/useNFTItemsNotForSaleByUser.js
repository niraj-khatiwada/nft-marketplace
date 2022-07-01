import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemsForSale() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getItemsNotForSaleByOwner = React.useCallback(
    async () => contract?.methods?.getItemsByUser(account, 4).call(),
    [contract, account]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getItemsNotForSaleByOwner',
    getItemsNotForSaleByOwner,
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
