pragma solidity ^0.5.0;

contract Bitcoin {
	bytes32 constant mask4 = 0xffffffff00000000000000000000000000000000000000000000000000000000;
	bytes1 constant network = 0x00;
	bytes1 constant networkPrefix = "1";
    bytes constant ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    mapping (string => mapping(bytes32 => bytes)) signatures;

    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (signature.length != 65) {
            return (address(0));
        }

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v, r, s);
        }
    }

    function truncate(uint8[] memory array, uint8 length) internal pure returns (uint8[] memory) {
        uint8[] memory output = new uint8[](length);
        for (uint8 i = 0; i<length; i++) {
            output[i] = array[i];
        }
        return output;
    }

    function reverse(uint8[] memory input) internal pure returns (uint8[] memory) {
        uint8[] memory output = new uint8[](input.length);
        for (uint8 i = 0; i<input.length; i++) {
            output[i] = input[input.length-1-i];
        }
        return output;
    }

    function toAlphabet(uint8[] memory indices) internal pure returns (bytes memory) {
        bytes memory output = new bytes(indices.length);
        for (uint8 i = 0; i<indices.length; i++) {
            output[i] = ALPHABET[indices[i]];
        }
        return output;
    }

    function bytesToBase58(bytes memory source) public pure returns (bytes memory) {
        if (source.length == 0) return new bytes(0);
        uint8[] memory digits = new uint8[](40);
        digits[0] = 0;
        uint8 digitlength = 1;
        for (uint8 i = 0; i<source.length; ++i) {
            uint carry = uint8(source[i]);
            for (uint8 j = 0; j<digitlength; ++j) {
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

    function getEthereumAddress(bytes memory publicKey) public pure returns (address ethereumAddress) {
        bytes32 publicKeyHash = keccak256(publicKey);
        assembly {
            mstore(0, publicKeyHash)
            ethereumAddress := mload(0)
        }
    }

    function getBitcoinAddress(bytes memory publicKey) public pure returns (string memory bitcoinAddress) {
        bytes20 publicKeyHash = ripemd160(abi.encodePacked(sha256(publicKey)));

        bytes32 checksumFull = sha256(abi.encodePacked(sha256(abi.encodePacked(network, publicKeyHash))));

        bytes4 checksumSliced = bytes4(checksumFull&mask4);

        bytes memory addressBytecode = abi.encodePacked(network, publicKeyHash, checksumSliced);

        bytes memory bitcoinAddressBase58 = bytesToBase58(addressBytecode);

        bitcoinAddress = string(abi.encodePacked(networkPrefix, bitcoinAddressBase58));
    }

    function isValidSignature(
        bytes memory signature,
        bytes32 messageHash,
        bytes memory publicKey,
        bytes memory publicKeyCompressed,
        string memory witness
    )
        public pure returns (bool)
    {
        address ethereumSignerAddress = recover(messageHash, signature);

        address ethereumWitnessAddress = getEthereumAddress(publicKey);

        string memory bitcoinWitnessAddress = getBitcoinAddress(publicKeyCompressed);

        if(ethereumWitnessAddress != ethereumSignerAddress) return false;

        if(keccak256(abi.encode(bitcoinWitnessAddress)) != keccak256(abi.encode(witness))) return false;

        return true;
    }

    function getSignature(string memory witness, bytes32 messageHash)
        public view returns (bytes memory signature)
    {
        signature = signatures[witness][messageHash];
    }

    function saveSignature(
        bytes memory signature,
        bytes32 messageHash,
        bytes memory publicKey,
        bytes memory publicKeyCompressed,
        string memory witness
    )
        public returns (bool)
    {
        require(isValidSignature(signature, messageHash, publicKey, publicKeyCompressed, witness) == true);

        signatures[witness][messageHash] = signature;

        emit RevealedSignature(signature, messageHash, witness);
    }

    event RevealedSignature(bytes signature, bytes32 messageHash, string witness);
}
