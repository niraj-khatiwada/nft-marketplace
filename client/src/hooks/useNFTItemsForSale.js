import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'

export default function useNFTItemsForSale() {
  const { contract } = useContract()

  const getItemsForSale = React.useCallback(
    async () => contract?.methods?.getItemsForSale().call(),
    [contract]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getItemsForSale',
    getItemsForSale,
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
