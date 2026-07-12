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



// create plan
router.post('/plan', authMiddleware, async (req, res) => {
  const { clientId, title, description, isTemplate } = req.body;
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: req.user.userId }
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        coach: { connect: { id: coach.id } },
        title,
        description,
        isTemplate,
        ...(clientId && { client: { connect: { id: clientId } } })
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// assign plan 
router.post('/plan/:templateId/assign', authMiddleware, async (req, res) => {
  const { clientId } = req.body;
  try {
    const template = await prisma.workoutPlan.findUnique({
      where: { id: req.params.templateId },
      include: { workoutSplits: { include: { exercises: true } } }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // deactivate client's current active plan, if any
    await prisma.workoutPlan.updateMany({
      where: { clientId, isActive: true },
      data: { isActive: false }
    });

    // clone the template into a new plan for this client
    const clonedPlan = await prisma.workoutPlan.create({
      data: {
        coach: { connect: { id: template.coachId } },
        client: { connect: { id: clientId } },
        title: template.title,
        description: template.description,
        isTemplate: false,
        isActive: true,
        clonedFrom: { connect: { id: template.id } },
        workoutSplits: {
          create: template.workoutSplits.map((split) => ({
            day: split.day,
            isRestDay: split.isRestDay,
            name: split.name,
            muscleGroups: split.muscleGroups,
            exercises: {
              create: split.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                order: ex.order,
                notes: ex.notes
              }))
            }
          }))
        }
      },
      include: { workoutSplits: { include: { exercises: true } } }
    });

    res.status(201).json(clonedPlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get all template plans for the logged-in coach
router.get('/plan/templates', authMiddleware, async (req, res) => {
  try {
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: req.user.userId }
    });

    console.log('req.user.userId:', req.user.userId);
    console.log('resolved coach:', coach);

    const plans = await prisma.workoutPlan.findMany({
      where: {
        coachId: coach.id,
        isTemplate: true
      },
      include: { workoutSplits: { include: { exercises: true } } }
    });
      console.log('plans found:', plans);
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


//get current plan
router.get('/activePlan/:clientId', authMiddleware, async (req, res) => {
  try {
    const plan = await prisma.workoutPlan.findFirst({
      where: { clientId: req.params.clientId, isActive: true },
      include: { workoutSplits: { include: { exercises: true } } }
    });

    if (!plan) {
      return res.status(404).json({ error: 'No active plan found for this client' });
    }

    res.json(plan);
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
    // check how many splits already exist for this plan
    const existingSplits = await prisma.workoutSplit.findMany({
      where: { workoutPlanId: planId }
    });

    if (existingSplits.length >= 7) {
      return res.status(400).json({ error: 'This plan already has 7 days assigned' });
    }

    // check if this specific day already exists for this plan
    const dayAlreadyExists = existingSplits.some((split) => split.day === day);

    if (dayAlreadyExists) {
      return res.status(400).json({ error: `${day} is already assigned for this plan` });
    }

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
//Get single split
router.get('/split/one/:id', authMiddleware, async (req, res) => {
    try {
        const split = await prisma.workoutSplit.findUnique({
            where: { id: req.params.id },
            include: { exercises: true }
        });
        if (!split) return res.status(404).json({ error: 'Split not found' });
        res.json(split);
    } catch (error) {
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
