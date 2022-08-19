import { initializeConnector } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'

const localChainId = process.env.REACT_APP_CHAIN_ID
const mode = process.env.REACT_APP_MODE

export const NETWORKS = {
  1: 'Ethereum Mainnet',
  4: 'Rinkeby Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon TestNet(Mumbai)',
  //
  [localChainId]: 'Ganache',
  //
}

const NETWORK_MAPPING = {
  mainnet: {
    1: NETWORKS[1],
    137: NETWORKS[137],
  },
  testnet: {
    4: NETWORKS[4],
    80001: NETWORKS[80001],
  },
  local: {
    [localChainId]: NETWORKS[localChainId],
  },
}

export const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/',
  4: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  137: 'https://polygon-rpc.com/',
  80001: 'https://rpc-mumbai.maticvigil.com/',
  [localChainId]: process.env.REACT_APP_RPC_SERVER,
}

export const CURRENCY = {
  1: 'ETH',
  4: 'ETH',
  137: 'MATIC',
  80001: 'MATIC',
  1337: 'ETH',
}

export const CHAIN = {
  1: 'ETHEREUM',
  4: 'ETHEREUM',
  137: 'POLYGON',
  80001: 'POLYGON',
  1337: 'ETHEREUM',
}

export const CHAIN_IDS = Object.keys(
  NETWORK_MAPPING?.[
    mode === 'production'
      ? 'mainnet'
      : mode === 'development'
      ? 'testnet'
      : 'local'
  ]
)?.map((chainId) => +chainId)

export const [metamask, metamaskHooks] = initializeConnector(
  (actions) => new MetaMask({ actions })
)

export const [walletconnect, walletConnectHooks] = initializeConnector(
  (actions) =>
    new WalletConnect({
      defaultChainId: CHAIN_IDS[0],
      actions,
      options: {
        rpc: RPC_URLS,
        qrcode: true,
        clientMeta: {
          url: process.env.REACT_APP_DOMAIN ?? '',
          name: 'Xungible',
          description: 'NFT Marketplace',
          icons: [],
        },
      },
    })
)

export const [network, networkHooks] = initializeConnector(
  (actions) =>
    new Network({ actions, urlMap: RPC_URLS, defaultChainId: CHAIN_IDS[0] })
)

export function getConnectorName(connector) {
  if (connector instanceof MetaMask) return 'METAMASK'
  if (connector instanceof WalletConnect) return 'WALLET_CONNECT'
  return 'UNKNOWN'
}

// Info
/*
  ChainId for networks:
    Mainnet: 1
    Rinkeby: 4

  ChainList: https://chainlist.org/

  For our app in production, we will only allow:
    Ethereum Mainnet: 1
    Polygon Mainnet: 137
  
  For development,
  Rinkeby Testnet(ETH): 4
   Mumbai Testnet(Matic): 80001
*/
