module.exports = {
  contracts_build_directory: '../client/public/contracts',
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.14+commit.80d49f37',
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'istanbul',
    },
  },
  evmVersion: 'istanbul',

  plugins: ['truffle-contract-size'],
}
