const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { Web3 } = require('web3');
const CryptoUtils = require('../utils/crypto');
const Web3Utils = require('../utils/web3');
const { verifyToken, voterOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get Active Polls
router.get('/active', verifyToken, voterOnly, async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Filter active polls by checking blockchain status
    const activePolls = [];
    
    for (const poll of polls) {
      try {
        const blockchainPoll = await Web3Utils.getPollDetails(poll.pollId);
        
        if (blockchainPoll.active && 
            Date.now() / 1000 >= Number(blockchainPoll.startTime) && 
            Date.now() / 1000 <= Number(blockchainPoll.endTime)) {
          
          // Check if user has already voted
          const hasVoted = await Web3Utils.hasUserVoted(poll.pollId, req.user.walletAddress);
          
          activePolls.push({
            id: poll.pollId,
            title: poll.title,
            description: poll.description,
            options: poll.options,
            hasVoted,
            endTime: new Date(Number(blockchainPoll.endTime) * 1000)
          });
        }
      } catch (error) {
        console.error(`Error checking poll ${poll.pollId}:`, error);
      }
    }

    res.json({ polls: activePolls });

  } catch (error) {
    console.error('Get active polls error:', error);
    res.status(500).json({ error: 'Failed to get active polls' });
  }
});

// Submit Vote
router.post('/vote', verifyToken, voterOnly, [
  body('pollId').isInt({ min: 1 }),
  body('selectedOption').notEmpty(),
  body('voterPrivateKey').matches(/^0x[a-fA-F0-9]{64}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pollId, selectedOption, voterPrivateKey } = req.body;

    // Get poll details
    const poll = await prisma.poll.findUnique({
      where: { pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Verify the private key belongs to the authenticated user
    const web3 = new Web3(process.env.GANACHE_URL || 'http://127.0.0.1:7545');
    const account = web3.eth.accounts.privateKeyToAccount(voterPrivateKey);
    
    if (account.address.toLowerCase() !== req.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Private key does not match wallet address' });
    }

    // Check if option is valid
    if (!poll.options.includes(selectedOption)) {
      return res.status(400).json({ error: 'Invalid option selected' });
    }

    // Check if user has already voted
    const hasVoted = await Web3Utils.hasUserVoted(pollId, req.user.walletAddress);
    if (hasVoted) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    // Prepare vote data
    const timestamp = Math.floor(Date.now() / 1000);
    const voteData = {
      pollId,
      selectedOption,
      voterId: req.user.voterId,
      timestamp
    };

    // Create vote hash for integrity
    const voteHash = CryptoUtils.createHash(voteData);

    // Encrypt vote data
    const encryptedVote = CryptoUtils.encrypt(JSON.stringify(voteData), poll.encryptionKey);

    // Submit vote to blockchain
    const blockchainResult = await Web3Utils.castVote(
      pollId,
      encryptedVote,
      voteHash,
      voterPrivateKey
    );

    // Save vote record to database
    await prisma.vote.create({
      data: {
        pollId,
        voterAddress: req.user.walletAddress,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: Number(blockchainResult.blockNumber)
      }
    });

    res.json({
      message: 'Vote submitted successfully',
      transactionHash: blockchainResult.transactionHash,
      blockNumber: Number(blockchainResult.blockNumber),
      voteHash
    });

  } catch (error) {
    console.error('Submit vote error:', error);
    res.status(500).json({ error: 'Failed to submit vote: ' + error.message });
  }
});

module.exports = router;