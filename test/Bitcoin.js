const { expect } = require('./helpers/setup')
const {
  sign,
  getPrivateKeyWif,
  getPublicKeyFromWif,
  getPublicKey,
  getEthereumAddress,
  getBitcoinAddress
} = require('./helpers/crypto')

const Bitcoin = artifacts.require('Bitcoin')

contract('Bitcoin', () => {
  const witnessPrivateKey = '0x2a0957f39b7edd9ef34d6d68ce8f6427ae8e1896ca49847b385b659b5ac04dce'
  const witnessPrivateKeyWif = getPrivateKeyWif(witnessPrivateKey)
  console.log('witnessPrivateKeyWif', witnessPrivateKeyWif)
  const witnessPublicKey = getPublicKey(witnessPrivateKey)
  console.log('witnessPublicKey', witnessPublicKey)
  const witnessPublicKeyCompressed = getPublicKeyFromWif(witnessPrivateKeyWif)
  console.log('witnessPublicKeyCompressed', witnessPublicKeyCompressed)
  const messageHash = '0x877fcd36dcedc3578d5058faaf8ee276f8fb5210baf0872cb610d59993a2655f'

  before(async() => {
    this.bitcoin = await Bitcoin.new()
    this.witnessEthereumAddress = await this.bitcoin.getEthereumAddress(witnessPublicKey)
    this.witnessBitcoinAddress = await this.bitcoin.getBitcoinAddress(witnessPublicKeyCompressed)
  })

  it('should generate correct ethereum address', async () => {
    const expectedEthereumAddress = getEthereumAddress(witnessPublicKey)

    console.log('expectedEthereumAddress', expectedEthereumAddress)

    expect(this.witnessEthereumAddress).to.be.equal(expectedEthereumAddress);
  })

  it('should generate correct bitcoin address', async () => {
    const expectedBitcoinAddress = getBitcoinAddress(witnessPublicKeyCompressed)

    console.log('expectedBitcoinAddress', expectedBitcoinAddress)

    expect(this.witnessBitcoinAddress).to.be.equal(expectedBitcoinAddress)
  })

  it('should accept valid signature', async () => {
    const witnessBitcoinAddress = getBitcoinAddress(witnessPublicKeyCompressed)
    const signature = sign(messageHash, witnessPrivateKey)

    console.log('signature', signature)

    const valid = await this.bitcoin.isValidSignature(
      signature, messageHash, witnessPublicKey, witnessPublicKeyCompressed, witnessBitcoinAddress
    )

    expect(valid).to.be.equal(true)
  })

  it('should emit saved signature', async () => {
    const witnessBitcoinAddress = getBitcoinAddress(witnessPublicKeyCompressed)
    const signature = sign(messageHash, witnessPrivateKey)

    const transaction = await this.bitcoin.saveSignature(
      signature, messageHash, witnessPublicKey, witnessPublicKeyCompressed, witnessBitcoinAddress
    )

    const event = transaction.logs.find(item => item.event == 'RevealedSignature')

    const savedSignature = await this.bitcoin.getSignature(witnessBitcoinAddress, messageHash)

    expect(event.args.signature).to.be.equal(signature)
    expect(event.args.messageHash).to.be.equal(messageHash)
    expect(event.args.witness).to.be.equal(witnessBitcoinAddress)

    expect(savedSignature).to.be.equal(signature)
  })
})
