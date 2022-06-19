import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

const localChainId = process.env.REACT_APP_CHAIN_ID
const mode = process.env.REACT_APP_MODE

export const NETWORKS = {
  1: 'Ethereum Mainnet',
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
    80001: NETWORKS[80001],
  },
  local: {
    [localChainId]: NETWORKS[localChainId],
  },
}

export const RPC_URLS = {
  1: 'https://mainnet.infura.io/v3/',
  137: 'https://polygon-rpc.com/',
  80001: 'https://rpc-mumbai.maticvigil.com/',
  [localChainId]: process.env.REACT_APP_RPC_SERVER,
}

export const CURRENCY = {
  1: 'ETH',
  137: 'MATIC',
  80001: 'MATIC',
  1337: 'ETH',
}

const CHAIN_IDS = Object.keys(
  NETWORK_MAPPING?.[
    mode === 'production'
      ? 'mainnet'
      : mode === 'development'
      ? 'testnet'
      : 'local'
  ]
)?.map((chainId) => +chainId)

export const injected = new InjectedConnector({
  supportedChainIds: CHAIN_IDS,
})

export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
  pollingInterval: 15000,
  supportedChainIds: CHAIN_IDS,
  clientMeta: { name: 'Xungible', description: 'NFT Marketplace', icons: [] },
})

export function resetWalletConnector(connector) {
  if (connector && connector instanceof WalletConnectConnector) {
    connector.walletConnectProvider = undefined
  }
}

// Info
/*
  ChainId for networks:
    Mainnet: 1
    Kovan: 42
    Ropsten: 3
    Rinkeby: 4
    Goerli: 5

  ChainList: https://chainlist.org/

  For our app in production, we will only allow:
    Ethereum Mainnet: 1
    Polygon Mainnet: 137
  
  For development,
   Mumbai Testnet(Polygon): 80001
*/
