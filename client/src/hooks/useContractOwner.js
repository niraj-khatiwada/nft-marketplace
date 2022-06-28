import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useContractOwner() {
  const { contract } = useContract()

  const { library } = useWeb3()

  const getOwner = React.useCallback(async () => {
    return contract?.methods?.owner().call()
  }, [contract])

  const { isLoading, data, isError, error } = useQuery(
    'useContractOwner',
    getOwner,
    {
      enabled: !(library == null),
    }
  )

  return {
    isLoading,
    isError,
    error,
    data,
  }
}
