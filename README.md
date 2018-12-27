# Diadem Protocol
Protocol allows to create escrow deposits in different cryptocurrencies and can be used in various applications. 

It is designed to minimize fees and provide easy experience for all participants.

## [Messages](contracts/Messages.sol)
`solc version 0.5.0+commit.1d4f565a.Emscripten.clang`

 ##### function getMessageHash
 constant pure 


 Type | Name |
--- | --- |
| address | creator |
| address | owner |
| string | item |
___
 ##### function getMessage
 constant view 


 Type | Name |
--- | --- |
| bytes32 | messageHash |
___
 ##### function saveMessage
  nonpayable 


 Type | Name |
--- | --- |
| address | owner |
| string | item |
___


## [Ethereum](contracts/Ethereum.sol)
`solc version 0.5.0+commit.1d4f565a.Emscripten.clang`

 ##### event RevealedSignature
   


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| address | witness |
___
 ##### function getSignature
 constant view 


 Type | Name |
--- | --- |
| address | witness |
| bytes32 | messageHash |
___
 ##### function isValidSignature
 constant pure 


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| address | witness |
___
 ##### function saveSignature
  nonpayable 


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| address | witness |
___


## [Bitcoin](contracts/Bitcoin.sol)
`solc version 0.5.0+commit.1d4f565a.Emscripten.clang`

 ##### event RevealedSignature
   


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| string | witness |
___
 ##### function bytesToBase58
 constant pure 


 Type | Name |
--- | --- |
| bytes | source |
___
 ##### function getEthereumAddress
 constant pure 


 Type | Name |
--- | --- |
| bytes | publicKey |
___
 ##### function getBitcoinAddress
 constant pure 


 Type | Name |
--- | --- |
| bytes | publicKey |
___
 ##### function isValidSignature
 constant pure 


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| bytes | publicKey |
| bytes | publicKeyCompressed |
| string | witness |
___
 ##### function getSignature
 constant view 


 Type | Name |
--- | --- |
| string | witness |
| bytes32 | messageHash |
___
 ##### function saveSignature
  nonpayable 


 Type | Name |
--- | --- |
| bytes | signature |
| bytes32 | messageHash |
| bytes | publicKey |
| bytes | publicKeyCompressed |
| string | witness |
___


## [Diadem](contracts/Diadem.sol)
`solc version 0.5.0+commit.1d4f565a.Emscripten.clang`

 ##### constructor 
  nonpayable 


 Type | Name |
--- | --- |
| address | messagesContract |
| address | ethereumContract |
| address | bitcoinContract |
___
 ##### event Create
   


 Type | Name |
--- | --- |
| bytes32 | messageHash |
| bytes32 | previousMessageHash |
___
 ##### event UpdateTitle
   


 Type | Name |
--- | --- |
| string | link |
| string | newTitle |
___
 ##### event Confirm
   


 Type | Name |
--- | --- |
| address | owner |
| string | link |
| address | witness |
___
 ##### function getHash
 constant view 


 Type | Name |
--- | --- |
| address | owner |
| string | link |
___
 ##### function getAchievementsChain
 constant view 


 Type | Name |
--- | --- |
| address | owner |
___
 ##### function getAchievementByHash
 constant view 


 Type | Name |
--- | --- |
| bytes32 | messageHash |
___
 ##### function getAchievement
 constant view 


 Type | Name |
--- | --- |
| address | owner |
| string | link |
___
 ##### function updateTitle
  nonpayable 


 Type | Name |
--- | --- |
| string | link |
| string | newTitle |
___
 ##### function create
  nonpayable 


 Type | Name |
--- | --- |
| string | link |
| string | title |
___
 ##### function confirm
  nonpayable 


 Type | Name |
--- | --- |
| address | owner |
| string | link |
| address | witness |
| bytes | signature |
___


## [Escrow](contracts/Escrow.sol)
`solc version 0.5.0+commit.1d4f565a.Emscripten.clang`

 ##### event NewDeposit
   


 Type | Name |
--- | --- |
| bytes32 | depositHash |
___
 ##### event WithdrawnDeposit
   


 Type | Name |
--- | --- |
| address | from |
| address | beneficiary |
| uint256 | amount |
| bytes32 | messageHash |
___
 ##### event RefundedDeposit
   


 Type | Name |
--- | --- |
| address | recipient |
| uint256 | amount |
| bytes32 | messageHash |
___
 ##### function getDepositHash
 constant pure 


 Type | Name |
--- | --- |
| address | from |
| bytes32 | messageHash |
| address | beneficiary |
| address | witness |
| uint256 | expirationTime |
___
 ##### function getDeposits
 constant view 


 Type | Name |
--- | --- |
| bytes32 | messageHash |
| address | witness |
___
 ##### function getDeposit
 constant view 


 Type | Name |
--- | --- |
| bytes32 | depositHash |
___
 ##### function deposit
  payable payable


 Type | Name |
--- | --- |
| bytes32 | messageHash |
| address | beneficiary |
| address | witness |
| uint256 | expirationTime |
| uint256 | witnessFee |
| uint256 | relayerFee |
___
 ##### function release
  nonpayable 


 Type | Name |
--- | --- |
| bytes32 | depositHash |
| bytes | signature |
___
 ##### function refund
  nonpayable 


 Type | Name |
--- | --- |
| bytes32 | depositHash |
___
 ##### function addWitnessFee
  payable payable


 Type | Name |
--- | --- |
| bytes32 | depositHash |
___
 ##### function addRelayerFee
  payable payable


 Type | Name |
--- | --- |
| bytes32 | depositHash |
___

---
