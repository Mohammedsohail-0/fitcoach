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

//get all clients for coach 
router.get('/clients', authMiddleware, async (req, res) => {
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: req.user.userId }
    })
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const clients = await prisma.clientProfile.findMany({
      where: { coachId: coach.id, isActive: true },
      include: {
        user: { select: { email: true, username: true } },
        workoutLogs: {
          where: {
            loggedAt: { gte: sevenDaysAgo }
          },
          select: { loggedAt: true }
        }
      }
    });
    //response
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Get single client
router.get('/clients/:id', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, username: true } } }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Update client
router.put('/clients/:id', authMiddleware, async (req, res) => {
  const { name, goal, notes } = req.body;
  try {
    const client = await prisma.clientProfile.update({
      where: { id: req.params.id },
      data: { name, goal, notes }
    });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Deactivate client (soft delete — a real client almost always has plans/logs,
// and hard-deleting would violate the FK on WorkoutPlan/WorkoutLog anyway)
router.delete('/clients/:id', authMiddleware, async (req, res) => {
  try {
    const client = await prisma.clientProfile.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Client deactivated successfully', client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

//invite client

router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: req.user.userId }
    });

    // create invitation
    const invitation = await prisma.Invitation.create({
      data: {
        coachId: coach.id,
      }
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.json({
      inviteLink: `${clientUrl}/register?invite=${invitation.inviteCode}`,
      inviteCode: invitation.inviteCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


  // get coach's own profile
  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const coach = await prisma.coachProfile.findUnique({
        where: { userId: req.user.userId },
        include: { user: { select: { email: true, username: true } } }
      });

      if (!coach) return res.status(404).json({ error: 'Coach not found' });

      res.json(coach);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  module.exports = router;