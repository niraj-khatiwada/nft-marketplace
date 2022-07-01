const Contract = artifacts.require('NFTMarketplace')

module.exports = function (deployer) {
  deployer.deploy(
    Contract,
    'Xungible NFT',
    'XNFT',
    'https://xungible.mypinata.cloud/ipfs/'
  )
}

// Xungible NFT,
// XNFT,
// https://xungible.mypinata.cloud/ipfs/
