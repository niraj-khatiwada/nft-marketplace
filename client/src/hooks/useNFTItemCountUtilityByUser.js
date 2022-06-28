import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useNFTItemCountUtilityByUser() {
  const { contract } = useContract()
  const { account } = useWeb3()

  const getNFTItemCountUtilityByUser = React.useCallback(async () => {
    return contract?.methods?.getNFTItemCountUtilityByUser(account).call()
  }, [contract, account])

  const { isLoading, data, isError, error, refetch } = useQuery(
    'getNFTItemCountUtilityByUser',
    getNFTItemCountUtilityByUser,
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
