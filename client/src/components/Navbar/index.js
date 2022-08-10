import React from 'react'
import { Container, Button, Spinner } from 'react-bootstrap'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import { Link } from 'react-router-dom'

import useWeb3, { errorsMapping } from '../../hooks/useWeb3'
import useBalance from '../../hooks/useBalance'
import useNetwork from '../../hooks/useNetwork'

function NavigationBar() {
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
  const { formatted } = useBalance()
  const { network } = useNetwork()

  const renderError = React.useMemo(() => {
    switch (error?.name) {
      case errorsMapping?.UnsupportedChainIdError?.name:
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
      case errorsMapping?.NoMetaMaskError?.name:
        return (
          <div className="d-flex align-items-center my-3">
            <div className="mx-3">
              <span className="text-danger m-0 d-block">
                Metamask extension was not found.
              </span>
              <div className="d-flex align-items-center">
                <span className="text-warning d-inline-block">
                  Metamask extension is not installed or is not supported in
                  this platform. If you are on mobile platform, connect Metamask
                  through Wallet Connect option.
                </span>
              </div>
            </div>
            <Button className="ms-2" onClick={disconnectWallet}>
              Disconnect Wallet
            </Button>
          </div>
        )
      default:
        return (
          <div className="d-flex align-items-center my-3">
            <p className="text-danger m-0">Something went wrong...</p>
            <Button className="ms-2" onClick={disconnectWallet}>
              Retry
            </Button>
          </div>
        )
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
              <Nav.Link>
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
                  <div className="d-flex align-items-center">
                    <p className="m-0 me-2">{network}</p>
                    <Link to="/profile">
                      <p className="m-0 me-2">My Profile</p>
                    </Link>
                    <p className="text-light m-0 p-0 mx-3 ">
                      Balance: {formatted}
                    </p>
                    <p className="m-0 me-2">
                      {account?.slice(0, 10)}...{account?.slice(-10)}
                    </p>
                  </div>
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

export default React.memo(NavigationBar)
