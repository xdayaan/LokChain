const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const CryptoUtils = require('../utils/crypto');
const Web3Utils = require('../utils/web3');
const { verifyToken, voterOnly } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Voter Login
router.post('/login', [
  body('voterId').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { voterId, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        voterId,
        isRegistered: true,
        isAdmin: false
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await CryptoUtils.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, voterId: user.voterId, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        voterId: user.voterId,
        walletAddress: user.walletAddress
      }
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Voting Status for Poll
router.get('/status/:pollId', verifyToken, voterOnly, async (req, res) => {
  try {
    const pollId = parseInt(req.params.pollId);
    
    // Check if user has voted on blockchain
    const hasVoted = await Web3Utils.hasUserVoted(pollId, req.user.walletAddress);
    
    // Get vote record from database if exists
    const voteRecord = await prisma.vote.findFirst({
      where: {
        pollId,
        voterAddress: req.user.walletAddress
      }
    });

    res.json({
      hasVoted,
      voteRecord: voteRecord ? {
        transactionHash: voteRecord.transactionHash,
        createdAt: voteRecord.createdAt
      } : null
    });

  } catch (error) {
    console.error('Get voting status error:', error);
    res.status(500).json({ error: 'Failed to get voting status' });
  }
});

module.exports = router;