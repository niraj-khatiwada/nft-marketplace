import React from 'react'
import { useWeb3React } from '@web3-react/core'

import useContract from '../hooks/useContract'

export default function SendFundToOwner() {
  const { library, account } = useWeb3React()
  const { contract } = useContract()

  React.useEffect(() => {
    contract?.methods
      ?.symbol?.()
      .call?.()
      ?.then((res) => console.log(res))
  }, [contract])

  const sendFund = async () => {
    try {
      const response = await contract?.methods
        ?.addCourse(1, library?.utils?.toWei('11', 'ether'))
        .send({
          from: account,
        })

      console.log('---Success--', response)
    } catch (error) {
      console.log('---', error)
    }
  }
  const getCourses = async () => {
    try {
      const response = await contract?.methods?.getAllCourses().call()

      console.log('---Success--', response)
    } catch (error) {
      console.log('---', error)
    }
  }

  const getCourseById = async () => {
    try {
      const response = await contract?.methods?.getCourse(1).call()

      console.log('---Success--', response)
    } catch (error) {
      const endIndex = error.message.search('{')

      if (endIndex >= 0) {
        throw error.message.substring(0, endIndex)
      }
    }
  }

  const getCoursesByOwner = async () => {
    try {
      const response = await contract?.methods
        ?.getCoursesByOwner(account)
        .call()

      console.log('---Success--', response)
    } catch (error) {
      console.log('---', error)
    }
  }

  return <div></div>
}
