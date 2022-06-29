const Contract = artifacts.require('NFTMarketplace')

module.exports = function (deployer) {
  deployer.deploy(
    Contract,
    'Xungible NFT',
    'XNFT',
    'https://xungible.mypinata.cloud/ipfs/',
    'Xungible',
    '1'
  )
}
// 0x63aCC977BF76EaaB99a9bFA4B84694b3d004eFB6

// https://mumbai.polygonscan.com/tx/0x6284e4848ca2300bebcb169b5a4b6269166a5c816e933b14f96ce19adc77e384

// https://mumbai.polygonscan.com/tx/0x6284e4848ca2300bebcb169b5a4b6269166a5c816e933b14f96ce19adc77e384
