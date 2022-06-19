import React from 'react'
import { useWeb3React } from '@web3-react/core'

import { CURRENCY } from '../helpers/connectors'

export default function useBalance() {
  const { library, account, chainId } = useWeb3React()

  const [balance, setBalance] = React.useState(0)

  React.useEffect(() => {
    ;(async function () {
      try {
        const _balance = await library?.eth?.getBalance(account)
        setBalance(library?.utils?.fromWei(_balance.toString(), 'ether'))
      } catch (error) {
        console.log('--', error)
      }
    })()
  }, [account, library.eth])
  return {
    balance,
    currency: CURRENCY?.[chainId],
    formatted: !(balance == null)
      ? `${balance} ${CURRENCY?.[chainId] ?? ''}`
      : '',
  }
}
