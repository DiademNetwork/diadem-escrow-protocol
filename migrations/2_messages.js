const Messages = artifacts.require("./Messages.sol")

module.exports = function (deployer, network, accounts) {
        deployer.then(async () => {
                await deployer.deploy(Messages)
        })
}
