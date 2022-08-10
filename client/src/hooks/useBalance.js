import React from 'react'
import { useQuery } from 'react-query'

import { CURRENCY } from '../helpers/connectors'
import useWeb3React from '../hooks/useWeb3'

export default function useBalance() {
  const { library, account, chainId } = useWeb3React()

  const getBalance = React.useCallback(async () => {
    const balance = await library?.eth?.getBalance(account)
    return library?.utils?.fromWei(balance.toString(), 'ether')
  }, [library, account])

  const { isLoading, data, isError, error } = useQuery(
    'useBalance',
    getBalance,
    {
      enabled: !(library == null),
    }
  )

  return {
    isLoading,
    isError,
    error,
    balance: data,
    currency: CURRENCY?.[chainId],
    formatted: !(data == null) ? `${data} ${CURRENCY?.[chainId] ?? ''}` : '',
  }
}
