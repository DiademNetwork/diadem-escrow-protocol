const keccak = require('./keccak')
var cryptoHash = require('crypto-hashing')

const keccak256 = keccak(256)
const hash160 = (buffer) => cryptoHash('hash160', buffer)
const hash256 = (buffer) => cryptoHash('hash256', buffer)

module.exports = { keccak256, hash160, hash256 }
