const Messages = artifacts.require("Messages")
const Ethereum = artifacts.require("Ethereum")
const Bitcoin = artifacts.require("Bitcoin")
const Diadem = artifacts.require("Diadem")

const fs = require("fs")
const ecrecoverBytecode = '0x' + fs.readFileSync("../contracts/ecrecover/ecrecover.bin").toString().trim()

const deployPrecompiled = (from) => {
  const Contract = new web3.eth.Contract([])
  return Contract.deploy({ data: ecrecoverBytecode }).send({ from: from, gas: 5500000 })
}

module.exports = async (deployer, network, accounts) => {
  const ecrecover = await deployPrecompiled(accounts[0])
  const messages = await deployer.deploy(Messages)
  const ethereum = await deployer.deploy(Ethereum)
  const bitcoin = await deployer.deploy(Bitcoin, ecrecover.options.address, "0x00", web3.utils.stringToHex("1"))
  const diadem = await deployer.deploy(Diadem, messages.address, ethereum.address, bitcoin.address)
}
