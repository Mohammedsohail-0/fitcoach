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

// Get workout streak
router.get('/streak', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const logs = await prisma.workoutLog.findMany({
      where: { clientId: client.id },
      orderBy: { loggedAt: 'desc' }
    });

    if (logs.length === 0) return res.json({ streak: 0 });

    // Calculate streak
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const logDates = [...new Set(logs.map(log => {
      const d = new Date(log.loggedAt);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }))];

    for (let i = 0; i < logDates.length; i++) {
      const logDate = new Date(logDates[i]);
      const diffDays = Math.round((currentDate - logDate) / (1000 * 60 * 60 * 24));

      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get calendar — logged days this month
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const logs = await prisma.workoutLog.findMany({
      where: {
        clientId: client.id,
        loggedAt: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    const loggedDays = [...new Set(logs.map(log => {
      const d = new Date(log.loggedAt);
      return d.getDate();
    }))];

    res.json({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      loggedDays
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get weight progression for an exercise
router.get('/progression/:exerciseId', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { userId: req.user.userId }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const logs = await prisma.exerciseLog.findMany({
      where: {
        exerciseId: req.params.exerciseId,
        workoutLog: { clientId: client.id }
      },
      include: { workoutLog: { select: { loggedAt: true } } },
      orderBy: { workoutLog: { loggedAt: 'asc' } }
    });

    const progression = logs.map(log => ({
      date: log.workoutLog.loggedAt,
      weightUsed: log.weightUsed,
      repsActual: log.repsActual,
      setNumber: log.setNumber
    }));

    res.json(progression);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;