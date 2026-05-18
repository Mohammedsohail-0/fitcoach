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




// Create workout plan
router.post('/plan', authMiddleware, async (req, res) => {
  const { clientId, title, description } = req.body;
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: req.user.userId }
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        coachId: coach.id,
        clientId,
        title,
        description
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Get all plans for a client
router.get('/plan/:clientId', authMiddleware, async (req, res) => {
  try {
    const plans = await prisma.workoutPlan.findMany({
      where: { clientId: req.params.clientId },
      include: { workoutSplits: { include: { exercises: true } } }
    });

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Update plan
router.put('/plan/:id', authMiddleware, async (req, res) => {
  const { title, description, isActive } = req.body;
  try {
    const plan = await prisma.workoutPlan.update({
      where: { id: req.params.id },
      data: { title, description, isActive }
    });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Delete plan
router.delete('/plan/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.workoutPlan.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Create workout split
router.post('/split', authMiddleware, async (req, res) => {
  const { planId, day, isRestDay, name, muscleGroups } = req.body;
  try {
    const split = await prisma.workoutSplit.create({
      data: { workoutPlanId: planId, day, isRestDay, name, muscleGroups }
    });

    res.status(201).json(split);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



// Get all splits for a plan
router.get('/split/:planId', authMiddleware, async (req, res) => {
  try {
    const splits = await prisma.workoutSplit.findMany({
      where: { workoutPlanId: req.params.planId },
      include: { exercises: true }
    });

    res.json(splits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Update split
router.put('/split/:id', authMiddleware, async (req, res) => {
  const { day, isRestDay, name, muscleGroups } = req.body;
  try {
    const split = await prisma.workoutSplit.update({
      where: { id: req.params.id },
      data: { day, isRestDay, name, muscleGroups }
    });

    res.json(split);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Delete split
router.delete('/split/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.workoutSplit.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Split deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Add exercise to split
router.post('/exercise', authMiddleware, async (req, res) => {
  const { splitId, name, sets, reps, weight, order, notes } = req.body;
  try {
    const exercise = await prisma.exercise.create({
      data: { 
        workoutSplitId: splitId, 
        name, 
        sets, 
        reps, 
        weight, 
        order, 
        notes 
      }
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get all exercises for a split
router.get('/exercise/:splitId', authMiddleware, async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { workoutSplitId: req.params.splitId },
      orderBy: { order: 'asc' }
    });

    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Update exercise
router.put('/exercise/:id', authMiddleware, async (req, res) => {
  const { name, sets, reps, weight, order, notes } = req.body;
  try {
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data: { name, sets, reps, weight, order, notes }
    });

    res.json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Delete exercise
router.delete('/exercise/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.exercise.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
