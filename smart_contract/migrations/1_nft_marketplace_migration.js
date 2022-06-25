const Contract = artifacts.require('NFTMarketplace')

module.exports = function (deployer) {
  deployer.deploy(Contract)
}
