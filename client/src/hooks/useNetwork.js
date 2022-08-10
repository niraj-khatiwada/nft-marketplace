import React from 'react'

import useWeb3React from './useWeb3'
import { NETWORKS } from '../helpers/connectors'

export default function useNetwork() {
  const { chainId, error } = useWeb3React()

  return {
    chainId: !(error == null) ? null : chainId,
    network: !(error == null) ? null : NETWORKS?.[chainId] ?? null,
  }
}
