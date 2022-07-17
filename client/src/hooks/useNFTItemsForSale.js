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


So noisy is taking "Math.min" as an argument which is a function(method) and its returning another function that rests(...) all the argument passed to it. 
In line 13 its calling Math.min by spreading args that means it will be f(3,2,1). When you spread an array it will passed...