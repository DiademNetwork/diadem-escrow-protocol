pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./Messages.sol";

interface IToken {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract Achievements {
    Messages messages;

    struct Achievement {
        address owner;
        string title;
        string link;
        bool exists;
    }

    mapping (bytes32 => Achievement) achievements;
    mapping (address => bytes32[]) chains;
    mapping (bytes32 => mapping (address => bool)) confirmedBy;

    address token;

    constructor(
        address messagesContract
    ) public {
        messages = Messages(messagesContract);
    }

    function initToken(address tokenContract) public {
        require(token == address(0));

        token = tokenContract;
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

    function confirm(address owner, string memory link)
        public
    {
        bytes32 messageHash = getHash(owner, link);

        require(achievements[messageHash].exists == true);

        confirmedBy[messageHash][msg.sender] = true;

        emit Confirm(owner, link, msg.sender);
    }

    function support(address userAddress, address creatorAddress, string memory link, uint256 amount)
        public
    {
        bytes32 messageHash = getHash(creatorAddress, link);

        require(achievements[messageHash].exists == true);

        IToken(token).transferFrom(userAddress, creatorAddress, amount);

        emit Support(userAddress, creatorAddress, link, amount);
    }

    event Create(bytes32 messageHash, bytes32 previousMessageHash);
    event UpdateTitle(string link, string newTitle);
    event Confirm(address owner, string link, address witness);
    event Support(address userAddress, address creatorAddress, string link, uint256 amount);
}
