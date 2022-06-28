import React from 'react'
import { Nav } from 'react-bootstrap'
import { useLocation } from 'react-router-dom'

import Navbar from '../../components/Navbar'
import Owned from './Owned'

export default function Profile() {
  const location = useLocation()

  const renderItems = React.useMemo(() => {
    const current = location.hash ?? '#owned'

    switch (current) {
      default:
        return <Owned />
    }
  }, [location.hash])

  return (
    <div>
      <Navbar />
      <section className="my-5">
        <Nav justify variant="tabs" defaultActiveKey="/profile#owned">
          <Nav.Item active>
            <Nav.Link href="/profile#owned">Owned</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#for-sale">For Sale</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#sold">Sold</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#not-for-sale">Not For Sale</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link href="/profile#created">Created</Nav.Link>
          </Nav.Item>
        </Nav>
      </section>
      <section className="m-4">{renderItems}</section>
    </div>
  )
}
