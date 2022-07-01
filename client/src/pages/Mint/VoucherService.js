const SIGNING_DOMAIN_NAME = process.env.REACT_APP_SIGNING_DOMAIN_NAME
const SIGNING_DOMAIN_VERSION = process.env.REACT_APP_SIGNING_DOMAIN_VERSION

class VoucherService {
  constructor(contract, contractAddress, chainId) {
    this.contract = contract
    this.contractAddress = contractAddress
    this.chainId = chainId
  }

  async createVoucherParams({
    tokenId,
    tokenURI,
    price,
    isForSale,
    isAuction,
    target,
    isRedeem,
  }) {
    const voucher = {
      tokenId,
      tokenURI,
      price,
      isForSale,
      isAuction,
      target,
      isRedeem,
    }
    const domain = await this._signingDomain()
    const types = {
      EIP712Domain: domain.types,
      NFTVoucher: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'tokenURI', type: 'string' },
        { name: 'price', type: 'uint256' },
        { name: 'isForSale', type: 'bool' },
        { name: 'isAuction', type: 'bool' },
        { name: 'target', type: 'address' },
        { name: 'isRedeem', type: 'bool' },
      ],
    }
    return {
      types,
      domain: domain.data,
      message: voucher,
    }
  }

  async _signingDomain() {
    return {
      data: {
        name: 'XungibleEIP712',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.contractAddress,
      },
      types: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    }
  }
}

export default VoucherService
