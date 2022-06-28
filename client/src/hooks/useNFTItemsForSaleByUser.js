import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemsForSale() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getItemsForSaleByOwner = React.useCallback(
    async () => contract?.methods?.getItemsForSaleByOwner(account).call(),
    [contract, account]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getItemsForSaleByOwner',
    getItemsForSaleByOwner,
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
