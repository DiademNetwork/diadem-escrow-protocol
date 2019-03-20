const DiademCoin = artifacts.require('DiademCoin')

module.exports = async (deployer, network, accounts) => {
  if (network !== 'loom_dapp_chain') {
    return
  }

  await deployer.deploy(DiademCoin)
}
