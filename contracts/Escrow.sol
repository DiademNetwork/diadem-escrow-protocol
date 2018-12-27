pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Escrow {
    struct Deposit {
        address payable from;
        bytes32 messageHash;
        address payable beneficiary;
        address payable witness;
        uint256 expirationTime;
        uint256 beneficiaryAmount;
        uint256 witnessFee;
        uint256 relayerFee;
        bool exists;
    }

    mapping (bytes32 => Deposit) deposits;
    mapping (bytes32 => mapping(address => bytes32[])) depositLists;
    mapping (bytes32 => uint256) depositIndexes;

    function getDepositHash(
        address from,
        bytes32 messageHash,
        address beneficiary,
        address witness,
        uint256 expirationTime
    )
        public pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(from, messageHash, beneficiary, witness, expirationTime));
    }

    function getDeposits(
        bytes32 messageHash, address witness
    )
        public view returns (bytes32[] memory)
    {
        return depositLists[messageHash][witness];
    }

    function getDeposit(
        bytes32 depositHash
    )
        public view returns (Deposit memory)
    {
        return deposits[depositHash];
    }

    function deposit(
        bytes32 messageHash,
        address payable beneficiary,
        address payable witness,
        uint256 expirationTime,
        uint256 witnessFee,
        uint256 relayerFee
    )
        external payable
    {
        address payable from = msg.sender;
        uint256 value = msg.value;

        require(value > 0 && value > witnessFee + relayerFee);

        uint256 beneficiaryAmount = value - witnessFee - relayerFee;

        bytes32 depositHash = getDepositHash(from, messageHash, beneficiary, witness, expirationTime);

        require(deposits[depositHash].exists == false);

        Deposit memory newDeposit = Deposit(
            from, messageHash, beneficiary, witness, expirationTime, beneficiaryAmount, witnessFee, relayerFee, true
        );

        deposits[depositHash] = newDeposit;
        depositLists[messageHash][witness].push(depositHash);
        depositIndexes[depositHash] = depositLists[messageHash][witness].length - 1;

        emit NewDeposit(depositHash);
    }

    function release(bytes32 depositHash, bytes calldata signature)
        external
    {
        address payable relayer = msg.sender;

        Deposit memory currentDeposit = deposits[depositHash];

        require(currentDeposit.exists == true);
        require(recover(currentDeposit.messageHash, signature) == currentDeposit.witness);
        require(now < currentDeposit.expirationTime);

        uint256 depositIndex = depositIndexes[depositHash];

        bytes32[] storage list = depositLists[currentDeposit.messageHash][currentDeposit.witness];

        delete list[depositIndex];
        delete deposits[depositHash];
        delete depositIndexes[depositHash];

        currentDeposit.beneficiary.transfer(currentDeposit.beneficiaryAmount);
        currentDeposit.witness.transfer(currentDeposit.witnessFee);
        relayer.transfer(currentDeposit.relayerFee);

        emit WithdrawnDeposit(currentDeposit.from, currentDeposit.beneficiary, currentDeposit.beneficiaryAmount, currentDeposit.messageHash);
    }

    function refund(bytes32 depositHash)
        external
    {
        address payable relayer = msg.sender;

        Deposit memory currentDeposit = deposits[depositHash];

        require(currentDeposit.exists == true);
        require(now >= currentDeposit.expirationTime);

        uint256 depositIndex = depositIndexes[depositHash];

        bytes32[] storage list = depositLists[currentDeposit.messageHash][currentDeposit.witness];

        delete deposits[depositHash];
        delete depositIndexes[depositHash];
        delete list[depositIndex];

        uint256 refundAmount = currentDeposit.beneficiaryAmount + currentDeposit.witnessFee;

        currentDeposit.from.transfer(refundAmount);
        relayer.transfer(currentDeposit.relayerFee);

        emit RefundedDeposit(currentDeposit.from, refundAmount, currentDeposit.messageHash);
    }

    function addWitnessFee(bytes32 depositHash)
        public payable
    {
        deposits[depositHash].witnessFee += msg.value;
    }

    function addRelayerFee(bytes32 depositHash)
        public payable
    {
        deposits[depositHash].relayerFee += msg.value;
    }

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

    event NewDeposit(bytes32 depositHash);
    event WithdrawnDeposit(address from, address beneficiary, uint256 amount, bytes32 messageHash);
    event RefundedDeposit(address recipient, uint256 amount, bytes32 messageHash);
}
