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

    const clients = await prisma.clientProfile.findMany({
      where: { coachId: coach.id },
      include: { user: { select: { email: true, username: true } } }
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

// Delete client
router.delete('/clients/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.clientProfile.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Client deleted successfully' });
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

    res.json({
      inviteLink: `https://fitcoach-xocd.onrender.com/register?invite=${invitation.inviteCode}`,
      inviteCode: invitation.inviteCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;