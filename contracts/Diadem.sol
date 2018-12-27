pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Messages.sol";
import "./Ethereum.sol";
import "./Bitcoin.sol";

contract Diadem {
    Messages messages;
    Ethereum ethereum;
    Bitcoin bitcoin;

    struct Achievement {
        address owner;
        string title;
        string link;
        bool exists;
    }

    mapping (bytes32 => Achievement) achievements;
    mapping (address => bytes32[]) chains;

    constructor(
        address messagesContract,
        address ethereumContract,
        address bitcoinContract
    ) public {
        messages = Messages(messagesContract);
        ethereum = Ethereum(ethereumContract);
        bitcoin = Bitcoin(bitcoinContract);
    }

    function getHash(address owner, string memory link)
        public view returns (bytes32)
    {
        return messages.getMessageHash(address(this), owner, link);
    }

    function getAchievementsChain(address owner)
        public view returns(bytes32[] memory)
    {
        return chains[owner];
    }

    function getAchievementByHash(bytes32 messageHash)
        public view returns(Achievement memory)
    {
        return achievements[messageHash];
    }

    function getAchievement(address owner, string memory link)
        public view returns(Achievement memory)
    {
        bytes32 messageHash = getHash(owner, link);
        return getAchievementByHash(messageHash);
    }

    function updateTitle(string memory link, string memory newTitle)
        public
    {
        address owner = msg.sender;

        bytes32 messageHash = getHash(owner, link);

        Achievement storage achievement = achievements[messageHash];

        require(achievement.owner == owner);

        require(keccak256(abi.encode(achievement.title)) != keccak256(abi.encode(newTitle)));

        achievement.title = newTitle;

        emit UpdateTitle(link, newTitle);
    }

    function create(string memory link, string memory title)
        public
    {
        address owner = msg.sender;

        bytes32 messageHash = messages.saveMessage(owner, link);

        bytes32 previousMessageHash = bytes32(0);

        uint256 achievementsChainLength = chains[owner].length;

        if (achievementsChainLength > 0) {
            previousMessageHash = chains[owner][achievementsChainLength - 1];
        }

        Achievement memory achievement = Achievement(owner, title, link, true);

        achievements[messageHash] = achievement;

        chains[owner].push(messageHash);

        emit Create(messageHash, previousMessageHash);
    }

    function confirm(address owner, string memory link, address witness, bytes memory signature)
        public
    {
        bytes32 messageHash = getHash(owner, link);

        require(achievements[messageHash].exists == true);

        ethereum.saveSignature(signature, messageHash, witness);

        emit Confirm(owner, link, witness);
    }

    event Create(bytes32 messageHash, bytes32 previousMessageHash);
    event UpdateTitle(string link, string newTitle);
    event Confirm(address owner, string link, address witness);
}
