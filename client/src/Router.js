import React from 'react'
import {
  Route,
  Redirect,
  useLocation,
  Switch,
  BrowserRouter,
} from 'react-router-dom'
import { Spinner } from 'react-bootstrap'

const LazyLoadedHomePage = React.lazy(() => import('./pages/Home/index'))
const LazyLoadedMintPage = React.lazy(() => import('./pages/Mint/index'))
const LazyLoadedProfilePage = React.lazy(() => import('./pages/Profile/index'))

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
            path="/profile"
            render={(...props) => <LazyLoadedProfilePage {...props} />}
          />
        </Switch>
      </React.Suspense>
    </BrowserRouter>
  )
}