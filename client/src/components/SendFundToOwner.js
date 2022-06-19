import React from 'react'
import { useWeb3React } from '@web3-react/core'

import useContract from '../hooks/useContract'

export default function SendFundToOwner() {
  const { library, account } = useWeb3React()
  const { contract } = useContract()

  const sendFund = async () => {
    try {
      const response = await contract?.methods?.storeAddress().send({
        from: account,
        value: library?.utils?.toWei('2.1', 'ether'),
      })

      console.log('---Success--', response)
    } catch (error) {
      console.log('---', error)
    }
  }

  return (
    <div>
      <button onClick={sendFund}>Send</button>
    </div>
  )
}
