const { expect, expectFail } = require('./helpers/setup')
const { sign } = require('./helpers/crypto')

const difference = (numberOne, numberTwo) => {
  const bigNumberOne = new web3.utils.BN(numberOne)
  const bigNumberTwo = new web3.utils.BN(numberTwo)

  return bigNumberOne.gte(bigNumberTwo) ?
    bigNumberOne.sub(bigNumberTwo).toNumber() :
    bigNumberTwo.sub(bigNumberOne).toNumber()
}

const Escrow = artifacts.require('Escrow')

contract('Escrow', ([_, from, beneficiary, relayer]) => {
  const witness = '0x7F123F1b8aB851D6cD0B0A46cD25122fbF6c16d0'
  const witnessPrivateKey = '0x2a0957f39b7edd9ef34d6d68ce8f6427ae8e1896ca49847b385b659b5ac04dce'
  const messageHash = '0x877fcd36dcedc3578d5058faaf8ee276f8fb5210baf0872cb610d59993a2655f'
  const expirationTime = Math.floor((new Date() / 1000)) + 3600
  const expiredTime = expirationTime - 3600
  const value = 1000
  const witnessFee = 50
  const relayerFee = 25

  before(async () => {
    this.escrow = await Escrow.new()
  })

  it('should hold funds until witness sign message', async () => {
    const beneficiaryAmount = value - witnessFee - relayerFee

    const transaction = await this.escrow.deposit(
      messageHash, beneficiary, witness, expirationTime, witnessFee, relayerFee,
      { from, value }
    )

    const event = transaction.logs.find(item => item.event == 'NewDeposit')

    const depositHash = event.args.depositHash

    const deposit = await this.escrow.getDeposit(depositHash)

    const deposits = await this.escrow.getDeposits(messageHash, witness)

    expect(deposit.from).to.be.equal(from)
    expect(deposit.messageHash).to.be.equal(messageHash)
    expect(deposit.beneficiary).to.be.equal(beneficiary)
    expect(deposit.witness).to.be.equal(witness)
    expect(parseInt(deposit.expirationTime)).to.be.equal(expirationTime)
    expect(parseInt(deposit.beneficiaryAmount)).to.be.equal(beneficiaryAmount)
    expect(deposit.exists).to.be.equal(true)

    expect(deposits.length).to.be.equal(1)
    expect(deposits[0]).to.be.equal(depositHash)
  })

  it('should reject withdrawal without valid signature', async () => {
    const invalidSignature = '0x1'
    const deposits = await this.escrow.getDeposits(messageHash, witness)
    const depositHash = deposits[0]

    expectFail(this.escrow.release(depositHash, invalidSignature, { from: relayer }))
  })

  it('should reject refund before expiration time', async () => {
    const depositHash = await this.escrow.getDepositHash(from, messageHash, beneficiary, witness, expirationTime)

    expectFail(this.escrow.refund(depositHash))
  })

  it('should release funds to beneficiary', async () => {
    const signature = sign(messageHash, witnessPrivateKey)

    const beneficiaryBalanceBefore = await web3.eth.getBalance(beneficiary)
    const witnessBalanceBefore = await web3.eth.getBalance(witness)
    const relayerBalanceBefore = await web3.eth.getBalance(relayer)

    const expectedDepositHash = await this.escrow.getDepositHash(from, messageHash, beneficiary, witness, expirationTime)
    const beneficiaryAmount = value - witnessFee - relayerFee

    const deposits = await this.escrow.getDeposits(messageHash, witness)
    const depositHash = deposits[0]

    const transaction = await this.escrow.release(depositHash, signature, { from: relayer })

    const event = transaction.logs.find(item => item.event == 'WithdrawnDeposit')

    const depositsUpdated = await this.escrow.getDeposits(messageHash, witness)

    const beneficiaryBalanceAfter = await web3.eth.getBalance(beneficiary)
    const witnessBalanceAfter = await web3.eth.getBalance(witness)
    const relayerBalanceAfter = await web3.eth.getBalance(relayer)

    expect(depositHash).to.be.equal(expectedDepositHash)
    expect(parseInt(depositsUpdated[0])).to.be.deep.equal(0)

    expect(event.args.from).to.be.equal(from)
    expect(event.args.beneficiary).to.be.equal(beneficiary)
    expect(event.args.amount.toNumber()).to.be.equal(beneficiaryAmount)
    expect(event.args.messageHash).to.be.equal(messageHash)

    expect(difference(beneficiaryBalanceAfter, beneficiaryBalanceBefore)).to.be.equal(beneficiaryAmount)
    expect(difference(witnessBalanceAfter, witnessBalanceBefore)).to.be.above(witnessFee)
    expect(difference(relayerBalanceAfter, relayerBalanceBefore)).to.be.above(relayerFee)
  })

  it('should refund funds to sponsor', async () => {
    const depositTransaction = await this.escrow.deposit(
      messageHash, beneficiary, witness, expiredTime, witnessFee, relayerFee,
      { from, value }
    )

    const sponsorBalanceBeforeRefund = await web3.eth.getBalance(from)

    const depositHash = depositTransaction.logs.find(item => item.event == 'NewDeposit').args.depositHash

    const refundTransaction = await this.escrow.refund(depositHash, { from: relayer })

    const refundEvent = refundTransaction.logs.find(item => item.event == 'RefundedDeposit')

    const sponsorBalanceAfter = await web3.eth.getBalance(from)

    expect(difference(sponsorBalanceAfter, sponsorBalanceBeforeRefund)).to.be.equal(value - relayerFee)
    expect(refundEvent.args.recipient).to.be.equal(from)
    expect(refundEvent.args.amount.toNumber()).to.be.equal(value - relayerFee)
    expect(refundEvent.args.messageHash).to.be.equal(messageHash)
  })
})
