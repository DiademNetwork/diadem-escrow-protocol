const fs = require('fs')
const HDWallet = require('truffle-hdwallet-provider')

const infuraKey = ''
const mnemonic = fs.readFileSync("mnemonic").toString().trim()

module.exports = {
  networks: {
     development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
     },

     ropsten: {
       provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraKey}`),
       network_id: 3,
       gas: 5500000,
       confirmations: 2,
       timeoutBlocks: 200,
       skipDryRun: true
     },
  },

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
  }
}
