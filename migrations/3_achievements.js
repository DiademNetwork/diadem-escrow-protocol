const Messages = artifacts.require("./Messages.sol")
const Achievements = artifacts.require("./Achievements.sol")

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    const messages = await Messages.deployed()
    await deployer.deploy(Achievements, messages.address)
  })
}