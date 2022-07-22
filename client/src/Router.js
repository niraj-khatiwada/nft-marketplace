import React from 'react'
import { Route, Switch, BrowserRouter } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'

const LazyLoadedHomePage = React.lazy(() => import('./pages/Home/index'))
const LazyLoadedMintPage = React.lazy(() => import('./pages/Mint/index'))
const LazyLoadedLazyMintPage = React.lazy(() => import('./pages/Mint/LazyMint'))
const LazyLoadedProfilePage = React.lazy(() => import('./pages/Profile/index'))
const LazyLoadedRestoreLazyNFTPage = React.lazy(() =>
  import('./pages/Mint/RestoreNFT')
)
const LazyLoadedBidOnItemPage = React.lazy(() =>
  import('./pages/Mint/BidOnItem')
)
const LazyLoadedBuyNFTPage = React.lazy(() => import('./pages/Mint/BuyNFT'))
const LazyLoadedNFTSaleStatusChangePage = React.lazy(() =>
  import('./pages/Mint/ChangeLazyNFTSaleStatus')
)

const LazyLoadedBuyLazyNFTPage = React.lazy(() =>
  import('./pages/Mint/BuyLazyNFT')
)

export default function Router() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<Spinner />}>
        <Switch>
          <Route
            exact
            path="/"
            render={(...props) => <LazyLoadedHomePage {...props} />}
          />
          <Route
            exact
            path="/mint"
            render={(...props) => <LazyLoadedMintPage {...props} />}
          />
          <Route
            exact
            path="/lazy-mint"
            render={(...props) => <LazyLoadedLazyMintPage {...props} />}
          />
          <Route
            exact
            path="/buy-lazy-nft"
            render={(...props) => <LazyLoadedBuyLazyNFTPage {...props} />}
          />
          <Route
            exact
            path="/restore-lazy-nft"
            render={(...props) => <LazyLoadedRestoreLazyNFTPage {...props} />}
          />
          <Route
            exact
            path="/buy-nft"
            render={(...props) => <LazyLoadedBuyNFTPage {...props} />}
          />
          <Route
            exact
            path="/change-lazy-sale-status"
            render={(...props) => (
              <LazyLoadedNFTSaleStatusChangePage {...props} />
            )}
          />
          <Route
            exact
            path="/bid"
            render={(...props) => <LazyLoadedBidOnItemPage {...props} />}
          />
          <Route
            exact
            path="/profile"
            render={(...props) => <LazyLoadedProfilePage {...props} />}
          />
        </Switch>
      </React.Suspense>
    </BrowserRouter>
  )
}
