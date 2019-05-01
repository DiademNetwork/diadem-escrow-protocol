const { expect, expectFail  } = require('./helpers/setup')
const { sign } = require('./helpers/crypto')

const Diadem = artifacts.require('Diadem')
const Messages = artifacts.require('Messages')
const Bitcoin = artifacts.require('Bitcoin')
const Ethereum = artifacts.require('Ethereum')

const fs = require("fs")
const ecrecoverBytecode = '0x' + fs.readFileSync("./contracts/ecrecover/ecrecover.bin").toString().trim()

contract('Diadem', ([deployer, from]) => {
  const witness = '0x7F123F1b8aB851D6cD0B0A46cD25122fbF6c16d0'
  const witnessPrivateKey = '0x2a0957f39b7edd9ef34d6d68ce8f6427ae8e1896ca49847b385b659b5ac04dce'

  const link = 'link-to-post'
  const title = 'title-to-show'

  before(async () => {
    this.messages = await Messages.new()
    this.ethereum = await Ethereum.new()

    const Contract = new web3.eth.Contract([])
    const ecrecover = await Contract.deploy({ data: ecrecoverBytecode }).send({ from: deployer, gas: 5500000 })

    this.bitcoin = await Bitcoin.new(ecrecover.options.address, "0x00", web3.utils.stringToHex("1"))

    this.diadem = await Diadem.new(
      this.messages.address,
      this.ethereum.address,
      this.bitcoin.address
    )
  })

  it('should publish new achievement', async () => {
    const transaction = await this.diadem.create(link, title, { from })

    const event = transaction.logs.find(item => item.event == 'Create')

    const messageHash = await this.messages.getMessageHash(
      this.diadem.address,
      from,
      link
    )

    const messageTitle = (await this.diadem.getAchievementByHash(messageHash)).title;

    const message = await this.messages.getMessage(messageHash)

    expect(event.args.messageHash).to.be.equal(messageHash)
    expect(parseInt(event.args.previousMessageHash, 16)).to.be.equal(0)

    expect(message.creator).to.be.equal(this.diadem.address)
    expect(message.owner).to.be.equal(from)
    expect(message.item).to.be.equal(link)

    expect(messageTitle).to.be.equal(title)
  })

  it('should compose chain of achievements', async () => {
    const anotherLink = 'link-to-next-post'
    const anotherTitle = 'another-title-to-show'

    const transaction = await this.diadem.create(anotherLink, anotherTitle, { from })

    const event = transaction.logs.find(item => item.event == 'Create')

    const { messageHash, previousMessageHash } = event.args

    const ownerAchievements = await this.diadem.getAchievementsChain(from)

    expect(ownerAchievements.length).to.be.equal(2)
    expect(ownerAchievements[0]).to.be.equal(previousMessageHash)
    expect(ownerAchievements[1]).to.be.equal(messageHash)
  })

  it('should update title', async () => {
    const updatedTitle = 'new-title-for-post'

    const transaction = await this.diadem.updateTitle(link, updatedTitle, { from })

    const event = transaction.logs.find(item => item.event == 'UpdateTitle')

    const achievement = await this.diadem.getAchievement(from, link)

    expect(event.args.link).to.be.equal(link)
    expect(event.args.newTitle).to.be.equal(updatedTitle)

    expect(achievement.title).to.be.equal(updatedTitle)
  })

  it('should confirm achievement', async () => {
    const messageHash = await this.diadem.getHash(from, link)

    const signature = sign(messageHash, witnessPrivateKey)

    const transaction = await this.diadem.confirm(from, link, witness, signature)

    const event = transaction.logs.find(item => item.event == 'Confirm')

    const savedSignature = await this.ethereum.getSignature(witness, messageHash)

    expect(event.args.owner).to.be.equal(from)
    expect(event.args.link).to.be.equal(link)
    expect(event.args.witness).to.be.equal(witness)
    expect(typeof event.args.time).to.be.equal('number')

    expect(savedSignature).to.be.equal(signature)
  })

  it('should reject existing achievement', async () => {
    await expectFail(this.diadem.create(link, title, { from }))
  })
})
