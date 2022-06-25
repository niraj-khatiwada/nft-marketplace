import React from 'react'
import { Container, Button, Spinner } from 'react-bootstrap'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'

import useWeb3 from '../../hooks/useWeb3'

function CollapsibleExample() {
  const {
    account,
    error,

    custom: {
      disconnectWallet,
      connectMetamask,
      connectWalletConnect,
      isLoading,
    },
  } = useWeb3()

  const renderError = React.useMemo(() => {
    switch (error?.name) {
      case 'UnsupportedChainIdError':
        return (
          <div className="d-flex align-items-center my-3">
            <div className="mx-3">
              <span className="text-danger m-0 d-block">
                Invalid Network: Only ETH and Polygon Mainnet allowed
              </span>
              <div className="d-flex align-items-center">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden ">Loading...</span>
                </Spinner>
                <span className="text-primary d-inline-block ms-2">
                  Waiting for network change
                </span>
              </div>
            </div>
            <Button className="ms-2" onClick={disconnectWallet}>
              Disconnect Wallet
            </Button>
          </div>
        )
      default:
        return <p className="text-danger m-0">Something went wrong...</p>
    }
  }, [error])

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Container>
        <Navbar.Brand href="/">NFT Marketplace</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto"></Nav>
          {isLoading ? (
            <>
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden ">Loading...</span>
              </Spinner>
            </>
          ) : error == null ? (
            <Nav className="d-flex align-items-center">
              <Nav.Link href="#deets">
                {account == null ? (
                  <>
                    <Button className="mx-2" onClick={connectMetamask}>
                      Connect Metamask
                    </Button>
                    <Button onClick={connectWalletConnect}>
                      Connect Wallet Connect
                    </Button>
                  </>
                ) : (
                  <p className="m-0 me-2">{account}</p>
                )}
              </Nav.Link>
              <Nav.Item>
                {account?.length > 0 ? (
                  <Button onClick={disconnectWallet}>Disconnect Wallet</Button>
                ) : null}{' '}
              </Nav.Item>
            </Nav>
          ) : (
            renderError
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default CollapsibleExample
