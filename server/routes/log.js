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

// Log a workout session
router.post('/workout', authMiddleware, async (req, res) => {
  const { planId, splitId, note, exercises } = req.body;
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Create workout log with exercise logs
    const log = await prisma.workoutLog.create({
      data: {
        clientId: client.id,
        planId,
        splitId,
        note,
        exerciseLogs: {
          create: exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            weightUsed: ex.weightUsed,
            repsActual: ex.repsActual,
            setNumber: ex.setNumber
          }))
        }
      },
      include: { exerciseLogs: true }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get all workout logs for a client
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const logs = await prisma.workoutLog.findMany({
      where: { clientId: client.id },
      include: {
        exerciseLogs: {
          include: { exercise: true }
        },
        split: true
      },
      orderBy: { loggedAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Coach views a client's logs
router.get('/history/:clientId', authMiddleware, async (req, res) => {
  try {
    const logs = await prisma.workoutLog.findMany({
      where: { clientId: req.params.clientId },
      include: {
        exerciseLogs: {
          include: { exercise: true }
        },
        split: true
      },
      orderBy: { loggedAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;