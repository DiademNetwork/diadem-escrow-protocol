const { expect, expectFail } = require('./helpers/setup')
const { keccak256 } = require('./helpers/crypto')

const Messages = artifacts.require('Messages')

contract('Messages', (accounts) => {
  const context = 'diadem.network'
  const item = 'achievement1'

  before(async () => {
    this.messages = await Messages.new()
  })

  it('should generate hash from message', async () => {
    const creator = '0x7f123f1b8ab851d6cd0b0a46cd25122fbf6c16d0'
    const owner = '0xc4d01132b087f9d3c0b2d75ff113806efd496743'
    const expectedMessageHash = '0x11727c79f41134e511daf90f9b9d588eb0c96448d6a36ad96cb86475a9193047'

    const messageHash = await this.messages.getMessageHash(creator, owner, item)

    expect(messageHash).to.be.equal(expectedMessageHash)
  })

  it('should save message in storage', async () => {
    const creator = accounts[0]
    const owner = accounts[1]

    await this.messages.saveMessage(owner, item);

    const messageHash = await this.messages.getMessageHash(creator, owner, item);

    const message = await this.messages.getMessage(messageHash);

    expect(message.creator).to.be.deep.equal(creator);
    expect(message.owner).to.be.deep.equal(owner);
    expect(message.item).to.be.deep.equal(item);
  })

  it('should reject rewriting message', async () => {
    const owner = accounts[1]

    await expectFail(this.messages.saveMessage(owner, item))
  })
})
