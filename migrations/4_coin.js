const DiademCoin = artifacts.require("./DiademCoin.sol")
const Achievements = artifacts.require("./Achievements.sol")

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    await deployer.deploy(DiademCoin)

    const achievements = await Achievements.deployed()
    const coin = await DiademCoin.deployed()

    await achievements.initToken(coin.address)
    await coin.initAchievements(achievements.address)
  })
}

