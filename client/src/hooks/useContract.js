import React from 'react'
import { useWeb3React } from '@web3-react/core'

// const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS
const TOKEN_CONTRACT_ADDRESS = '0x9A08D7E98Aba8cBc16A8525A828942dB380dfC2C'

export default function useContract() {
  const { library } = useWeb3React()

  const [contract, setContract] = React.useState(null)

  React.useEffect(() => {
    library?.eth?.Contract &&
      (async function () {
        const contractJson = await fetch('/contracts/NFTMarketplace.json')
        const artifacts = await contractJson.json()
        setContract(
          new library.eth.Contract(artifacts.abi, TOKEN_CONTRACT_ADDRESS)
        )
      })()
  }, [library])

  return { contract }
}
