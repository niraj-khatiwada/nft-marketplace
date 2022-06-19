import React from 'react'

import useNetwork from '../hooks/useNetwork'

export default function Network() {
  const { network, chainId } = useNetwork()

  return (
    <div>
      Network: {network} [{chainId}]
    </div>
  )
}
