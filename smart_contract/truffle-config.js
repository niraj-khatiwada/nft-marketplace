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
      version: '0.8.14',
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  plugins: ['truffle-contract-size'],
}
