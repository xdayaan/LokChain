const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = {
  // Verify JWT token
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid token.' });
    }
  },

  // Admin only middleware
  adminOnly: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Registered voter only middleware
  voterOnly: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user || !user.isRegistered) {
        return res.status(403).json({ error: 'Access denied. Voter not registered.' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = authMiddleware;