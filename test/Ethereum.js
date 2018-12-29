const { expect } = require('./helpers/setup')
const { sign } = require('./helpers/crypto')

const Ethereum = artifacts.require('Ethereum')

contract('Ethereum', () => {
  const witness = '0x7F123F1b8aB851D6cD0B0A46cD25122fbF6c16d0'
  const witnessPrivateKey = '0x2a0957f39b7edd9ef34d6d68ce8f6427ae8e1896ca49847b385b659b5ac04dce'
  const messageHash = '0x877fcd36dcedc3578d5058faaf8ee276f8fb5210baf0872cb610d59993a2655f'

  before(async() => {
    this.ethereum = await Ethereum.new()
  })

  it('should accept valid signature', async () => {
    const signature = sign(messageHash, witnessPrivateKey)

    const valid = await this.ethereum.isValidSignature(signature, messageHash, witness)

    expect(valid).to.be.equal(true)
  })

  it('should reject invalid signature', async () => {
    const hackerPrivateKey = witnessPrivateKey.replace('a', 'b')
    const invalidSignature = sign(messageHash, hackerPrivateKey)

    const valid = await this.ethereum.isValidSignature(invalidSignature, messageHash, witness)

    expect(valid).to.be.equal(false)
  })

  it('should emit saved signature', async () => {
    const signature = sign(messageHash, witnessPrivateKey)

    const transaction = await this.ethereum.saveSignature(messageHash, signature)

    const event = transaction.logs.find(item => item.event == 'RevealedSignature')

    const savedSignature = await this.ethereum.getSignature(witness, messageHash)

    expect(event.args.signature).to.be.equal(signature)
    expect(event.args.messageHash).to.be.equal(messageHash)
    expect(event.args.witness).to.be.equal(witness)

    expect(savedSignature).to.be.equal(signature)
  })
})
