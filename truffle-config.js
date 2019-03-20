const fs = require('fs')
const path = require('path')
const LoomTruffleProvider = require('loom-truffle-provider')
const HDWalletProvider = require('truffle-hdwallet-provider')

const readSecret = (name) => {
  return fs.readFileSync(path.join(__dirname, 'secrets', name)).toString().trim()
}

module.exports = {
  mocha: {
    timeout: 100000
  },
  compilers: {
    solc: {
      version: "0.5.0",
      docker: false,
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        },
        evmVersion: "byzantium"
      }
    }
  },
  networks: {
    plasma_chain: {
      provider: function() {
        const privateKey = readSecret('loom_mainnet_private_key')
        const chainId = 'default'
        const writeUrl = 'http://plasma.dappchains.com:80/rpc'
        const readUrl = 'http://plasma.dappchains.com:80/query'
        return new LoomTruffleProvider(chainId, writeUrl, readUrl, privateKey)
      },
      network_id: '*'
    },
    extdev_plasma_us1: {
      provider: function() {
        const privateKey = readSecret('loom_testnet_private_key')
        const chainId = 'extdev-plasma-us1'
        const writeUrl = 'http://extdev-plasma-us1.dappchains.com:80/rpc'
        const readUrl = 'http://extdev-plasma-us1.dappchains.com:80/query'
        return new LoomTruffleProvider(chainId, writeUrl, readUrl, privateKey)
      },
      network_id: '*'
    },
    loom_dapp_chain: {
      provider: function() {
        const privateKey = readSecret('loom_local_private_key')
        const chainId = 'default'
        const writeUrl = 'http://127.0.0.1:46658/rpc'
        const readUrl = 'http://127.0.0.1:46658/query'
        const loomTruffleProvider = new LoomTruffleProvider(chainId, writeUrl, readUrl, privateKey)
        loomTruffleProvider.createExtraAccountsFromMnemonic("gravity top burden flip student usage spell purchase hundred improve check genre", 10)
        return loomTruffleProvider
      },
      network_id: '*'
    },
    mainnet: {
      provider: function() {
        const mnemonic = readSecret('mainnet_mnemonic')
        const infuraKey = readSecret('infura_key')
        return new HDWalletProvider(mnemonic, `https://ropsten.mainnet.io/v3/${infuraKey}`)
      },
      network_id: 1,
      gas: 5500000,
      skipDryRun: false
    },
    ropsten: {
      provider: function() {
        const mnemonic = readSecret('ropsten_mnemonic')
        const infuraKey = readSecret('infura_key')
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraKey}`)
      },
      network_id: 3,
      gas: 5500000,
      skipDryRun: false
    },
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*",
    }
  }
}
