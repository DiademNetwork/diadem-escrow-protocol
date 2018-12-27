pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract Messages {
    struct Message {
        address creator; // application smart contract
        address owner; // context of message
        string item; // identifier of message
        bool exists;
    }

    mapping (bytes32 => Message) messages;

    function getMessageHash(address creator, address owner, string memory item)
        public pure returns (bytes32)
    {
        bytes32 messageHash = keccak256(abi.encodePacked(creator, owner, item));

        return messageHash;
    }

    function getMessage(bytes32 messageHash)
        public view returns (Message memory)
    {
        return messages[messageHash];
    }

    function saveMessage(address owner, string calldata item)
        external returns (bytes32)
    {
        address creator = msg.sender;

        bytes32 messageHash = getMessageHash(creator, owner, item);

        require(messages[messageHash].exists == false, "Message already exists");

        Message memory message = Message(creator, owner, item, true);

        messages[messageHash] = message;

        return messageHash;
    }
}
