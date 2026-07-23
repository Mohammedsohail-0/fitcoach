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
          where: { isArchived: false },
          include: {
            exercises: {
              where: { isArchived: false },
              orderBy: { order: 'asc' }
            }
          },
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


// Log today's body weight (creates a history row + updates the "current" convenience field)
router.post('/bodyweight', authMiddleware, async (req, res) => {
  try {
    const { weight } = req.body;

    if (weight === undefined || weight === null || isNaN(weight)) {
      return res.status(400).json({ error: 'weight is required and must be a number' });
    }

    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const roundedWeight = Math.round(Number(weight));

    const [log] = await prisma.$transaction([
      prisma.bodyWeightLog.create({
        data: { clientId: client.id, weight: roundedWeight }
      }),
      prisma.clientProfile.update({
        where: { id: client.id },
        data: { bodyWeight: roundedWeight }
      })
    ]);

    res.json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get body weight history (most recent first) — also used to check if today is already logged
router.get('/bodyweight', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const logs = await prisma.bodyWeightLog.findMany({
      where: { clientId: client.id },
      orderBy: { loggedAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get client's active workout plan with splits and exercises

module.exports = router;