require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const authMiddleware = require('../middleware/auth');

const pool = new (require('pg').Pool)({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const router = express.Router();

// Get client's own profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId },
      include: { user: { select: { email: true, username: true } } }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get client's active workout plan with splits and exercises
router.get('/plan', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const plan = await prisma.workoutPlan.findFirst({
      where: { clientId: client.id, isActive: true },
      include: {
        workoutSplits: {
          include: { exercises: { orderBy: { order: 'asc' } } },
          orderBy: { day: 'asc' }
        }
      }
    });

    if (!plan) return res.status(404).json({ error: 'No active plan found' });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;