const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const CryptoUtils = require('../utils/crypto');
const Web3Utils = require('../utils/web3');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Admin Registration
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('walletAddress').matches(/^0x[a-fA-F0-9]{40}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, walletAddress } = req.body;

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Check if email or wallet already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { walletAddress }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or wallet address already registered' });
    }

    const passwordHash = await CryptoUtils.hashPassword(password);
    const voterId = CryptoUtils.generateVoterId();

    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        walletAddress,
        voterId,
        isAdmin: true,
        isRegistered: true
      }
    });

    const token = jwt.sign(
      { userId: admin.id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        walletAddress: admin.walletAddress,
        voterId: admin.voterId
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const admin = await prisma.user.findFirst({
      where: {
        email,
        isAdmin: true
      }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await CryptoUtils.verifyPassword(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: admin.id, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        walletAddress: admin.walletAddress,
        voterId: admin.voterId
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Poll
router.post('/polls', verifyToken, adminOnly, [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('options').isArray({ min: 2 }),
  body('duration').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, options, duration } = req.body;

    // Generate encryption key for this poll
    const encryptionKey = CryptoUtils.generateEncryptionKey();

    // Create poll on blockchain
    const blockchainResult = await Web3Utils.createPoll(
      title,
      description,
      options,
      duration * 3600 // Convert hours to seconds
    );

        // Extract poll ID from blockchain transaction
    const pollId = parseInt(blockchainResult.events.PollCreated.returnValues.pollId);

    // Save poll to database
    const poll = await prisma.poll.create({
      data: {
        pollId,
        title,
        description,
        options,
        encryptionKey,
        createdBy: req.user.userId
      }
    });

    res.status(201).json({
      message: 'Poll created successfully',
      poll: {
        id: poll.id,
        pollId: poll.pollId,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        transactionHash: blockchainResult.transactionHash
      }
    });

  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll: ' + error.message });
  }
});

// Register Voter
router.post('/voters', verifyToken, adminOnly, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('walletAddress').matches(/^0x[a-fA-F0-9]{40}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, walletAddress } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { walletAddress }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or wallet address already registered' });
    }

    const passwordHash = await CryptoUtils.hashPassword(password);
    const voterId = CryptoUtils.generateVoterId();

    // Register voter on blockchain
    await Web3Utils.registerVoter(walletAddress);

    // Save voter to database
    const voter = await prisma.user.create({
      data: {
        email,
        passwordHash,
        walletAddress,
        voterId,
        isAdmin: false,
        isRegistered: true
      }
    });

    res.status(201).json({
      message: 'Voter registered successfully',
      voter: {
        id: voter.id,
        email: voter.email,
        walletAddress: voter.walletAddress,
        voterId: voter.voterId
      }
    });

  } catch (error) {
    console.error('Voter registration error:', error);
    res.status(500).json({ error: 'Failed to register voter: ' + error.message });
  }
});

// Get Poll Results
router.get('/polls/:id/results', verifyToken, adminOnly, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id);

    // Get poll from database
    const poll = await prisma.poll.findUnique({
      where: { pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get votes from blockchain
    const blockchainVotes = await Web3Utils.getVotesByPoll(pollId);

    // Decrypt votes and tally results
    const results = {};
    poll.options.forEach(option => {
      results[option] = 0;
    });

    const decryptedVotes = blockchainVotes.map(vote => {
      try {
        const decryptedVote = CryptoUtils.decrypt(vote.encryptedVote, poll.encryptionKey);
        const voteData = JSON.parse(decryptedVote);
        
        // Verify vote integrity
        const expectedHash = CryptoUtils.createHash({
          pollId: voteData.pollId,
          selectedOption: voteData.selectedOption,
          voterId: voteData.voterId,
          timestamp: voteData.timestamp
        });

        if (expectedHash === vote.voteHash) {
          if (results.hasOwnProperty(voteData.selectedOption)) {
            results[voteData.selectedOption]++;
          }
          return {
            voter: vote.voter,
            selectedOption: voteData.selectedOption,
            timestamp: new Date(voteData.timestamp * 1000),
            verified: true
          };
        } else {
          return {
            voter: vote.voter,
            verified: false,
            error: 'Vote integrity check failed'
          };
        }
      } catch (error) {
        return {
          voter: vote.voter,
          verified: false,
          error: 'Failed to decrypt vote'
        };
      }
    });

    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0);

    res.json({
      poll: {
        id: poll.pollId,
        title: poll.title,
        description: poll.description,
        options: poll.options
      },
      results,
      totalVotes,
      votes: decryptedVotes
    });

  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ error: 'Failed to get poll results: ' + error.message });
  }
});

// Get All Polls (Admin)
router.get('/polls', verifyToken, adminOnly, async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    res.json({ polls });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to get polls' });
  }
});

module.exports = router;