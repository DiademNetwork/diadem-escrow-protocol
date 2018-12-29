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

const fs = require("fs")
const ecrecoverBytecode = '0x' + fs.readFileSync("./contracts/ecrecover/ecrecover.bin").toString().trim()

contract('Bitcoin', ([deployer]) => {
  const messageHash = '0x877fcd36dcedc3578d5058faaf8ee276f8fb5210baf0872cb610d59993a2655f'
  const witnessPrivateKey = '0x2a0957f39b7edd9ef34d6d68ce8f6427ae8e1896ca49847b385b659b5ac04dce'
  const witnessPrivateKeyWif = getPrivateKeyWif(witnessPrivateKey)
  const witnessPublicKey = getPublicKey(witnessPrivateKey)
  const witnessPublicKeyCompressed = getPublicKeyFromWif(witnessPrivateKeyWif)

  before(async() => {
    const Contract = new web3.eth.Contract([])

    const ecrecover = await Contract.deploy({ data: ecrecoverBytecode }).send({ from: deployer, gas: 5500000 })

    this.bitcoin = await Bitcoin.new(ecrecover.options.address, "0x00", web3.utils.stringToHex("1"))

    this.witnessBitcoinAddress = await this.bitcoin.getBitcoinAddress(witnessPublicKeyCompressed)
  })

  it('should generate bitcoin address from public key', async () => {
    const expectedBitcoinAddress = getBitcoinAddress(witnessPublicKeyCompressed)

    expect(this.witnessBitcoinAddress).to.be.equal(expectedBitcoinAddress)
  })

  it('should recover bitcoin address from signature', async () => {
    const witnessBitcoinAddress = getBitcoinAddress(witnessPublicKeyCompressed)
    const signature = sign(messageHash, witnessPrivateKey)

    const transaction = await this.bitcoin.saveSignature(
      messageHash, signature
    )

    const event = transaction.logs.find(item => item.event == 'RevealedSignature')

    const savedSignature = await this.bitcoin.getSignature(witnessBitcoinAddress, messageHash)

    expect(event.args.signature).to.be.equal(signature)
    expect(event.args.messageHash).to.be.equal(messageHash)
    expect(event.args.witness).to.be.equal(witnessBitcoinAddress)

    expect(savedSignature).to.be.equal(signature)
  })

  it('should check if number is even', async () => {
    const result1 = await this.bitcoin.isEven(4)
    const result2 = await this.bitcoin.isEven(5)

    expect(result1).to.be.equal(true)
    expect(result2).to.be.equal(false)
  })
})
