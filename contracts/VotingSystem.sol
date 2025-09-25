// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VotingSystem is Ownable, ReentrancyGuard {
    struct Poll {
        uint256 id;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        bool active;
        address creator;
    }

    struct Vote {
        uint256 pollId;
        address voter;
        string encryptedVote;
        string voteHash;
        uint256 timestamp;
    }

    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public registeredVoters;
    mapping(uint256 => Vote[]) public pollVotes;
    
    uint256 public pollCounter;
    
    event PollCreated(uint256 indexed pollId, string title, address creator);
    event VoterRegistered(address indexed voter);
    event VoteCast(uint256 indexed pollId, address indexed voter, string voteHash);

    constructor() Ownable(msg.sender) {
        pollCounter = 0;
    }

    modifier onlyRegisteredVoter() {
        require(registeredVoters[msg.sender], "Voter not registered");
        _;
    }

    modifier validPoll(uint256 _pollId) {
        require(_pollId > 0 && _pollId <= pollCounter, "Invalid poll ID");
        require(polls[_pollId].active, "Poll is not active");
        require(block.timestamp >= polls[_pollId].startTime, "Poll not started");
        require(block.timestamp <= polls[_pollId].endTime, "Poll ended");
        _;
    }

    function createPoll(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _duration
    ) external onlyOwner returns (uint256) {
        require(_options.length >= 2, "Poll must have at least 2 options");
        require(_duration > 0, "Duration must be greater than 0");

        pollCounter++;
        
        polls[pollCounter] = Poll({
            id: pollCounter,
            title: _title,
            description: _description,
            options: _options,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            active: true,
            creator: msg.sender
        });

        emit PollCreated(pollCounter, _title, msg.sender);
        return pollCounter;
    }

    function registerVoter(address _voter) external onlyOwner {
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function castVote(
        uint256 _pollId,
        string memory _encryptedVote,
        string memory _voteHash
    ) external onlyRegisteredVoter validPoll(_pollId) nonReentrant {
        require(!hasVoted[_pollId][msg.sender], "Already voted in this poll");
        require(bytes(_encryptedVote).length > 0, "Encrypted vote cannot be empty");
        require(bytes(_voteHash).length > 0, "Vote hash cannot be empty");

        hasVoted[_pollId][msg.sender] = true;
        
        Vote memory newVote = Vote({
            pollId: _pollId,
            voter: msg.sender,
            encryptedVote: _encryptedVote,
            voteHash: _voteHash,
            timestamp: block.timestamp
        });

        pollVotes[_pollId].push(newVote);
        
        emit VoteCast(_pollId, msg.sender, _voteHash);
    }

    // Function to cast vote on behalf of a registered voter (for gasless voting)
    function castVoteFor(
        address _voter,
        uint256 _pollId,
        string memory _encryptedVote,
        string memory _voteHash
    ) external onlyOwner validPoll(_pollId) nonReentrant {
        require(registeredVoters[_voter], "Voter not registered");
        require(!hasVoted[_pollId][_voter], "Voter already voted in this poll");
        require(bytes(_encryptedVote).length > 0, "Encrypted vote cannot be empty");
        require(bytes(_voteHash).length > 0, "Vote hash cannot be empty");

        hasVoted[_pollId][_voter] = true;
        
        Vote memory newVote = Vote({
            pollId: _pollId,
            voter: _voter,
            encryptedVote: _encryptedVote,
            voteHash: _voteHash,
            timestamp: block.timestamp
        });

        pollVotes[_pollId].push(newVote);
        
        emit VoteCast(_pollId, _voter, _voteHash);
    }

    function getPollDetails(uint256 _pollId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        bool active
    ) {
        require(_pollId > 0 && _pollId <= pollCounter, "Invalid poll ID");
        Poll memory poll = polls[_pollId];
        return (
            poll.id,
            poll.title,
            poll.description,
            poll.options,
            poll.startTime,
            poll.endTime,
            poll.active
        );
    }

    function hasUserVoted(uint256 _pollId, address _voter) external view returns (bool) {
        return hasVoted[_pollId][_voter];
    }

    function getVotesByPoll(uint256 _pollId) external view onlyOwner returns (Vote[] memory) {
        return pollVotes[_pollId];
    }

    function getVoteCount(uint256 _pollId) external view returns (uint256) {
        return pollVotes[_pollId].length;
    }

    function endPoll(uint256 _pollId) external onlyOwner {
        require(_pollId > 0 && _pollId <= pollCounter, "Invalid poll ID");
        polls[_pollId].active = false;
    }

    function isVoterRegistered(address _voter) external view returns (bool) {
        return registeredVoters[_voter];
    }
}