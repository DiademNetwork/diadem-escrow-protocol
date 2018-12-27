pragma solidity ^0.5.0;

contract Ethereum {
    mapping (address => mapping(bytes32 => bytes)) signatures;

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

    function getSignature(address witness, bytes32 messageHash)
        public view returns (bytes memory signature)
    {
        signature = signatures[witness][messageHash];
    }

    function isValidSignature(bytes memory signature, bytes32 messageHash, address witness)
        public pure returns (bool)
    {
        if (recover(messageHash, signature) != witness)
            return false;

        return true;
    }

    function saveSignature(bytes memory signature, bytes32 messageHash, address witness)
        public
    {
        require(isValidSignature(signature, messageHash, witness) == true);

        signatures[witness][messageHash] = signature;

        emit RevealedSignature(signature, messageHash, witness);
    }

    event RevealedSignature(bytes signature, bytes32 messageHash, address witness);
}
