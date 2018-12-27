const elliptic = require("elliptic")
const secp256k1 = new (elliptic.ec)("secp256k1")
const base58 = require("bs58")
const bitcoin = require('bitcoinjs-lib')
var wif = require('wif')
const Bytes = require("./bytes")
const { keccak256, hash160, hash256 } = require("./hash")

const encodeSignature = ([v, r, s]) =>
  Bytes.flatten([r,s,v]);

const makeSign = addToV => (hash, privateKey) => {
  const signature = secp256k1
    .keyFromPrivate(new Buffer(privateKey.slice(2), "hex"))
    .sign(new Buffer(hash.slice(2), "hex"), {canonical: true})

  return encodeSignature([
    Bytes.pad(1, Bytes.fromNumber(addToV + signature.recoveryParam)),
    Bytes.pad(32, Bytes.fromNat("0x" + signature.r.toString(16))),
    Bytes.pad(32, Bytes.fromNat("0x" + signature.s.toString(16)))])
}

const sign = makeSign(27)

const toChecksum = address => {
  const addressHash = keccak256(address.slice(2));
  let checksumAddress = "0x";
  for (let i = 0; i < 40; i++)
    checksumAddress += parseInt(addressHash[i + 2], 16) > 7
      ? address[i + 2].toUpperCase()
      : address[i + 2];
  return checksumAddress;
}

const getEthereumAddress = publicKey => {
  const publicHash = keccak256(publicKey);
  const address = toChecksum("0x" + publicHash.slice(-40));

  return address
}

const getPrivateKeyWif = privateKey => {
  const privateKeyBuffer = new Buffer(privateKey.slice(2), 'hex')
  const privateKeyWif = wif.encode(128, privateKeyBuffer, true)

  return privateKeyWif
}

const getPublicKeyFromWif = privateKeyWif => {
  const ecpair = bitcoin.ECPair.fromWIF(privateKeyWif)
  const publicKey = ecpair.getPublicKeyBuffer()
  const publicKeyHex = '0x' + publicKey.toString('hex')

  return publicKeyHex
}

const getBitcoinAddress = (publicKey, testnet = false) => {
  const publicKeyBuffer = new Buffer(publicKey.slice(2), 'hex')
  const ecpair = bitcoin.ECPair.fromPublicKeyBuffer(publicKeyBuffer)
  const address = ecpair.getAddress()

  return address
}

const getPublicKey = privateKey => {
  const buffer = new Buffer(privateKey.slice(2), "hex");
  const ecKey = secp256k1.keyFromPrivate(buffer);
  const publicKey = "0x" + ecKey.getPublic(false, 'hex').slice(2);

  return publicKey
}

/*
const getBitcoinAddress = (publicKey, testnet = false) => {
  const networkPrefix = testnet ? '6F' : '00'
  const publicKeyHash = hash160(Buffer.from(publicKey))

  const publicKeyHashPrefixed = Buffer.concat([
    Buffer.from(networkPrefix, 'hex'),
    publicKeyHash
  ])
  const publicKeyChecksum = Buffer.from(hash256(publicKeyHashPrefixed).toString('hex').slice(0, 8), 'hex')
  const bitcoinAddress = base58.encode(Buffer.concat([publicKeyHashPrefixed, publicKeyChecksum]).slice(0, 25))

  return bitcoinAddress
}
*/

module.exports = {
  sign,
  getPrivateKeyWif,
  getPublicKeyFromWif,
  getPublicKey,
  getEthereumAddress,
  getBitcoinAddress
}
