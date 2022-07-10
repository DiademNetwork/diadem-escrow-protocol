pragma solidity ^0.5.0;

contract Bitcoin {
    bytes32 constant private mask4 = 0xffffffff00000000000000000000000000000000000000000000000000000000;
    bytes constant private ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    bytes1 private network;
    bytes1 private networkPrefix;

    address private recoverPublicKey;

    mapping (string => mapping(bytes32 => bytes)) private signatures;

    event RevealedSignature(bytes signature, bytes32 messageHash, string witness);

    constructor(address ecrecoverContract, bytes1 networkByte, bytes1 networkPrefixByte) public {
        recoverPublicKey = ecrecoverContract;
        network = networkByte;
        networkPrefix = networkPrefixByte;
    }

    function getSignature(string memory witness, bytes32 messageHash)
        public view returns (bytes memory signature)
    {
        signature = signatures[witness][messageHash];
    }

    function saveSignature(
        bytes32 messageHash,
        bytes memory signature
    )
        public
    {
        string memory bitcoinAddress = recoverBitcoinAddress(messageHash, signature);

        require(getSignature(bitcoinAddress, messageHash).length == 0);

        signatures[bitcoinAddress][messageHash] = signature;

        emit RevealedSignature(signature, messageHash, bitcoinAddress);
    }

    function recoverBitcoinAddress(bytes32 hash, bytes memory signature)
        internal returns (string memory)
    {
        bytes memory compressedPublicKey = recoverCompressedPublicKey(hash, signature);

        string memory bitcoinAddress = getBitcoinAddress(compressedPublicKey);

        return bitcoinAddress;
    }

    function recoverCompressedPublicKey(bytes32 hash, bytes memory signature)
        internal returns (bytes memory)
    {
        (bytes32 publicKeyX, bytes32 publicKeyY) = recoverPublicKeyCoordinates(hash, signature);

        uint8 publicKeyPrefix;

        if (isEven(uint256(publicKeyY))) {
            publicKeyPrefix = 2;
        } else {
            publicKeyPrefix = 3;
        }

        bytes memory compressedPublicKey = abi.encodePacked(publicKeyPrefix, publicKeyX);

        return compressedPublicKey;
    }

    function recoverPublicKeyCoordinates(bytes32 hash, bytes memory signature)
        internal returns (bytes32 publicKeyX, bytes32 publicKeyY)
    {
        address recoverPublicKeyAddress = recoverPublicKey;
        bytes4 recoverPublicKeySignature = bytes4(keccak256("ecrecover(uint256,uint256,uint256,uint256)"));

        assembly {
            let r := mload(add(signature, 0x20))
            let s := mload(add(signature, 0x40))
            let v := byte(0, mload(add(signature, 0x60)))

            let recoverInput := mload(0x40)

            mstore(recoverInput, recoverPublicKeySignature)

            mstore(add(recoverInput, 0x04), hash)

            mstore(add(recoverInput, 0x24), v)

            mstore(add(recoverInput, 0x44), r)

            mstore(add(recoverInput, 0x64), s)

            let recoveredPublicKey := mload(0x40)

            if iszero(call(sub(gas, 2000), recoverPublicKeyAddress, 0, recoverInput, 0x84, recoveredPublicKey, 0x80)) {
                revert(0, 0)
            }

            publicKeyX := mload(add(recoveredPublicKey, 0x40))
            publicKeyY := mload(add(recoveredPublicKey, 0x60))

            mstore(0x40, add(recoverInput, 0x84))
        }
    }

    function isEven(uint256 number)
        public pure returns (bool)
    {
        if (number & 1 == 0) {
            return true;
        } else {
            return false;
        }
    }

    function getBitcoinAddress(bytes memory publicKey) public view returns (string memory bitcoinAddress) {
        bytes20 publicKeyHash = ripemd160(abi.encodePacked(sha256(abi.encodePacked(publicKey))));

        bytes32 checksumFull = sha256(abi.encodePacked(sha256(abi.encodePacked(network, publicKeyHash))));

        bytes4 checksumSliced = bytes4(checksumFull&mask4);

        bytes memory addressBytecode = abi.encodePacked(network, publicKeyHash, checksumSliced);

        bytes memory bitcoinAddressBase58 = bytesToBase58(addressBytecode);

        bitcoinAddress = string(abi.encodePacked(networkPrefix, bitcoinAddressBase58));
    }

    function bytesToBase58(bytes memory source)
        public pure returns (bytes memory)
    {
        if (source.length == 0) return new bytes(0);

        uint8[] memory digits = new uint8[](40);
        digits[0] = 0;

        uint8 digitlength = 1;

        for (uint8 i = 0; i < source.length; ++i) {
            uint carry = uint8(source[i]);

            for (uint8 j = 0; j < digitlength; ++j) {
                carry += uint(digits[j]) * 256;
                digits[j] = uint8(carry % 58);
                carry = carry / 58;
            }

            while (carry > 0) {
                digits[digitlength] = uint8(carry % 58);
                digitlength++;
                carry = carry / 58;
            }
        }

        return toAlphabet(reverse(truncate(digits, digitlength)));
    }

    function truncate(uint8[] memory array, uint8 length)
        internal pure returns (uint8[] memory)
    {
        uint8[] memory output = new uint8[](length);

        for (uint8 i = 0; i<length; i++) {
            output[i] = array[i];
        }

        return output;
    }

    function reverse(uint8[] memory input)
        internal pure returns (uint8[] memory)
    {
        uint8[] memory output = new uint8[](input.length);

        for (uint8 i = 0; i<input.length; i++) {
            output[i] = input[input.length-1-i];
        }

        return output;
    }

    function toAlphabet(uint8[] memory indices)
        internal pure returns (bytes memory)
    {
        bytes memory output = new bytes(indices.length);

        for (uint8 i = 0; i<indices.length; i++) {
            output[i] = ALPHABET[indices[i]];
        }

        return output;
    }
}
