import React from 'react'
import { useWeb3React } from '@web3-react/core'

const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS

export default function useContract() {
  const { library } = useWeb3React()

  const [contract, setContract] = React.useState(null)

  React.useEffect(() => {
    ;(async function () {
      const contractJson = await fetch('/contracts/FirstContract.json')
      const artifacts = await contractJson.json()
      setContract(
        new library.eth.Contract(artifacts.abi, TOKEN_CONTRACT_ADDRESS)
      )
    })()
  }, [])

  return { contract }
}
