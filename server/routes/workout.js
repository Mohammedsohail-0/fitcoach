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
      include: { workoutSplits: { include: { exercises: { include: { exerciseSets: true } } } } }
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
            clonedFromId: split.id,
            exercises: {
              create: split.exercises
                .filter((ex) => !ex.isArchived)
                .map((ex) => ({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                order: ex.order,
                notes: ex.notes,
                clonedFromId: ex.id,
                exerciseSets: {
                  create: ex.exerciseSets.map((s) => ({
                    setNumber: s.setNumber,
                    reps: s.reps,
                    weight: s.weight
                  }))
                }
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


// Get a single plan by id (template or assigned) — used by EditPlan
router.get('/plan/:id', authMiddleware, async (req, res) => {
  try {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: req.params.id },
      include: {
        workoutSplits: {
          include: {
            exercises: {
              where: { isArchived: false },
              include: { exerciseSets: true }
            }
          }
        }
      }
    });

    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// How many active client plans currently trace back to this template —
// used to decide whether Save shows the "push to clients" dialog at all.
router.get('/plan/:id/active-clones-count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.workoutPlan.count({
      where: { clonedFromId: req.params.id, isActive: true }
    });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Push a template's current state into every active client plan cloned
// from it. Diff/merge, not delete-recreate — matches rows via clonedFromId
// so logs (which reference exercise/split ids) never get orphaned.
// Best-effort: one client failing doesn't roll back the others.
router.post('/plan/:templateId/push', authMiddleware, async (req, res) => {
  try {
    const template = await prisma.workoutPlan.findUnique({
      where: { id: req.params.templateId },
      include: {
        workoutSplits: {
          where: { isArchived: false },
          include: { exercises: { where: { isArchived: false }, include: { exerciseSets: true } } }
        }
      }
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    const clones = await prisma.workoutPlan.findMany({
      where: { clonedFromId: template.id, isActive: true },
      include: {
        client: { select: { name: true } },
        workoutSplits: {
          include: {
            workoutLogs: { select: { id: true } },
            exercises: { include: { exerciseSets: true, exerciseLogs: { select: { id: true } } } }
          }
        }
      }
    });

    const results = { updated: 0, total: clones.length, failed: [] };

    for (const clientPlan of clones) {
      try {
        await pushTemplateToClientPlan(template, clientPlan);
        results.updated += 1;
      } catch (err) {
        console.error(`Push failed for client plan ${clientPlan.id}:`, err);
        results.failed.push({
          clientId: clientPlan.clientId,
          clientName: clientPlan.client?.name || 'Unknown client',
          reason: 'Could not update this client\'s plan. Please check it manually.'
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong pushing to clients' });
  }
});

// Diff/merge one client's clone against the template's current state.
// Runs inside a single transaction so one client's update is all-or-nothing,
// even though the overall push across all clients is best-effort.
async function pushTemplateToClientPlan(template, clientPlan) {
  await prisma.$transaction(async (tx) => {
    // sync plan-level fields
    await tx.workoutPlan.update({
      where: { id: clientPlan.id },
      data: { title: template.title, description: template.description }
    });

    const templateSplitIds = new Set(template.workoutSplits.map(s => s.id));

    // splits removed from the template entirely
    for (const clientSplit of clientPlan.workoutSplits) {
      if (clientSplit.isArchived) continue;
      if (!clientSplit.clonedFromId || templateSplitIds.has(clientSplit.clonedFromId)) continue;

      const hasLogs = clientSplit.workoutLogs?.length > 0 ||
        clientSplit.exercises.some(e => e.exerciseLogs?.length > 0);

      if (hasLogs) {
        await tx.workoutSplit.update({ where: { id: clientSplit.id }, data: { isArchived: true } });
      } else {
        await tx.workoutSplit.delete({ where: { id: clientSplit.id } });
      }
    }

    // splits present on the template
    for (const templateSplit of template.workoutSplits) {
      const clientSplit = clientPlan.workoutSplits.find(
        s => s.clonedFromId === templateSplit.id && !s.isArchived
      );

      if (!clientSplit) {
        // day was added to the template after this client was cloned
        await tx.workoutSplit.create({
          data: {
            workoutPlanId: clientPlan.id,
            day: templateSplit.day,
            isRestDay: templateSplit.isRestDay,
            name: templateSplit.name,
            muscleGroups: templateSplit.muscleGroups,
            clonedFromId: templateSplit.id,
            exercises: {
              create: templateSplit.exercises.map(ex => ({
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                order: ex.order,
                notes: ex.notes,
                clonedFromId: ex.id,
                exerciseSets: {
                  create: ex.exerciseSets.map(s => ({ setNumber: s.setNumber, reps: s.reps, weight: s.weight }))
                }
              }))
            }
          }
        });
        continue;
      }

      await tx.workoutSplit.update({
        where: { id: clientSplit.id },
        data: {
          day: templateSplit.day,
          isRestDay: templateSplit.isRestDay,
          name: templateSplit.name,
          muscleGroups: templateSplit.muscleGroups
        }
      });

      const templateExerciseIds = new Set(templateSplit.exercises.map(e => e.id));

      // exercises removed from this day on the template
      for (const clientEx of clientSplit.exercises) {
        if (clientEx.isArchived) continue;
        if (!clientEx.clonedFromId || templateExerciseIds.has(clientEx.clonedFromId)) continue;

        if (clientEx.exerciseLogs?.length > 0) {
          await tx.exercise.update({ where: { id: clientEx.id }, data: { isArchived: true } });
        } else {
          await tx.exercise.delete({ where: { id: clientEx.id } });
        }
      }

      // exercises present on this day on the template
      for (const templateEx of templateSplit.exercises) {
        const clientEx = clientSplit.exercises.find(
          e => e.clonedFromId === templateEx.id && !e.isArchived
        );

        if (!clientEx) {
          await tx.exercise.create({
            data: {
              workoutSplitId: clientSplit.id,
              name: templateEx.name,
              muscleGroup: templateEx.muscleGroup,
              order: templateEx.order,
              notes: templateEx.notes,
              clonedFromId: templateEx.id,
              exerciseSets: {
                create: templateEx.exerciseSets.map(s => ({ setNumber: s.setNumber, reps: s.reps, weight: s.weight }))
              }
            }
          });
          continue;
        }

        await tx.exercise.update({
          where: { id: clientEx.id },
          data: {
            name: templateEx.name,
            muscleGroup: templateEx.muscleGroup,
            order: templateEx.order,
            notes: templateEx.notes
          }
        });

        // sets have no logs pointing at them directly — safe to wipe/recreate
        await tx.exerciseSet.deleteMany({ where: { exerciseId: clientEx.id } });
        await tx.exerciseSet.createMany({
          data: templateEx.exerciseSets.map(s => ({
            exerciseId: clientEx.id,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight
          }))
        });
      }
    }
  });
}

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
    const split = await prisma.workoutSplit.findUnique({
      where: { id: req.params.id },
      include: {
        workoutLogs: { select: { id: true } },
        exercises: { include: { exerciseLogs: { select: { id: true } } } }
      }
    });

    if (!split) return res.status(404).json({ error: 'Split not found' });

    const hasLogs = split.workoutLogs.length > 0 || split.exercises.some(e => e.exerciseLogs.length > 0);

    if (hasLogs) {
      const archived = await prisma.workoutSplit.update({
        where: { id: req.params.id },
        data: { isArchived: true }
      });
      return res.json({ message: 'Day has logged history, archived instead of deleted', split: archived });
    }

    await prisma.workoutSplit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Split deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Add exercise to split
router.post('/exercise', authMiddleware, async (req, res) => {
  const { splitId, name, muscleGroup, order, notes, sets } = req.body;
  try {
    const exercise = await prisma.exercise.create({
      data: {
        workoutSplitId: splitId,
        name,
        muscleGroup,
        order,
        notes,
        ...(Array.isArray(sets) && sets.length > 0 && {
          exerciseSets: {
            create: sets.map((s, i) => ({
              setNumber: s.setNumber ?? i + 1,
              reps: parseInt(s.reps, 10) || 0,
              weight: s.weight !== '' && s.weight != null ? parseFloat(s.weight) : null
            }))
          }
        })
      },
      include: { exerciseSets: true }
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Bulk save all exercises (with their sets) for a split — replaces whatever
// currently exists for that split. This is what CreatePlan's ExerciseSection
// calls on "Save"/"Finish", since the UI builds a full draft of exercises
// per muscle group before persisting anything.
router.post('/split/:splitId/exercises', authMiddleware, async (req, res) => {
  const { splitId } = req.params;
  const { exercises } = req.body; // [{ name, muscleGroup, order, sets: [{ setNumber, reps, weight }] }]

  if (!Array.isArray(exercises)) {
    return res.status(400).json({ error: 'exercises must be an array' });
  }

  const invalid = exercises.find(e => !e.name || !e.name.trim());
  if (invalid) {
    return res.status(400).json({ error: 'Every exercise needs a name' });
  }

  try {
    const split = await prisma.workoutSplit.findUnique({ where: { id: splitId } });
    if (!split) return res.status(404).json({ error: 'Split not found' });

    const saved = await prisma.$transaction(async (tx) => {
      // wipe existing exercises for this split (ExerciseSet cascades via schema)
      await tx.exercise.deleteMany({ where: { workoutSplitId: splitId } });

      const created = [];
      for (const ex of exercises) {
        const exercise = await tx.exercise.create({
          data: {
            workoutSplitId: splitId,
            name: ex.name.trim(),
            muscleGroup: ex.muscleGroup,
            order: ex.order ?? 0,
            notes: ex.notes || null,
            exerciseSets: {
              create: (ex.sets || []).map((s, i) => ({
                setNumber: s.setNumber ?? i + 1,
                reps: parseInt(s.reps, 10) || 0,
                weight: s.weight !== '' && s.weight != null ? parseFloat(s.weight) : null
              }))
            }
          },
          include: { exerciseSets: true }
        });
        created.push(exercise);
      }
      return created;
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong saving exercises' });
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
// Update exercise (name/muscleGroup/order/notes only — use the bulk
// /split/:splitId/exercises route to change sets)
router.put('/exercise/:id', authMiddleware, async (req, res) => {
  const { name, muscleGroup, order, notes } = req.body;
  try {
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id },
      data: { name, muscleGroup, order, notes },
      include: { exerciseSets: true }
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
    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.id },
      include: { exerciseLogs: { select: { id: true } } }
    });

    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    if (exercise.exerciseLogs.length > 0) {
      const archived = await prisma.exercise.update({
        where: { id: req.params.id },
        data: { isArchived: true }
      });
      return res.json({ message: 'Exercise has logged history, archived instead of deleted', exercise: archived });
    }

    await prisma.exercise.delete({ where: { id: req.params.id } });
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;