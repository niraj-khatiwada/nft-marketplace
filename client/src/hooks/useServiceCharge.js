import React from 'react'
import { useQuery } from 'react-query'

import useContract from './useContract'
import useWeb3 from './useWeb3'

export default function useServiceCharge() {
  const { contract } = useContract()
  const { library } = useWeb3()

  const getServiceCharge = React.useCallback(async () => {
    return contract?.methods?.serviceCharge().call()
  }, [contract])

  const { isLoading, data, isError, error } = useQuery(
    'useServiceCharge',
    getServiceCharge,
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
