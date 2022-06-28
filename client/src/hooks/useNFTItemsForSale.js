import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemsForSale() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getNFTItemsForSale = React.useCallback(
    async () => contract?.methods?.getNFTItemsForSale().call(),
    [contract, account]
  )

  const { isLoading, data, isError, error, refetch } = useQuery(
    'get-nft',
    getNFTItemsForSale,
    {
      enabled: !(contract == null),
      onError: (error) => {
        console.log('--Error--', error)
      },
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
