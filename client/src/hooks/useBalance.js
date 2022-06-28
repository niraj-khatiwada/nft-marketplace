import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { useQuery } from 'react-query'

import { CURRENCY } from '../helpers/connectors'

export default function useBalance() {
  const { library, account, chainId } = useWeb3React()

  const getBalance = React.useCallback(async () => {
    const balance = await library?.eth?.getBalance(account)
    return library?.utils?.fromWei(balance.toString(), 'ether')
  }, [library])

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
