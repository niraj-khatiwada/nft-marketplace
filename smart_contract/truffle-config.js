module.exports = {
  contracts_build_directory: '../client/public/contracts',
  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.8.14', // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
}

// const instance = await FirstContract.deployed()
// instance.storeAddress({from: accounts[0], value: 2e18.toString()})
