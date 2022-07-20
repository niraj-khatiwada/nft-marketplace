import React from 'react'
import { useWeb3React } from '@web3-react/core'

import { NETWORKS } from '../helpers/connectors'

export default function useBalance() {
  const { chainId, error } = useWeb3React()

  console.log('--', error?.name)

  return {
    chainId: chainId,
    network: NETWORKS?.[chainId] ?? null,
  }
}
