import React from 'react'

import { useWeb3React } from '@web3-react/core'
import { CURRENCY } from '../helpers/connectors'
import useBalance from '../hooks/useBalance'

export default function Balance() {
  const { formatted } = useBalance()

  return <div>Balance: {formatted}</div>
}
