require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new (require('pg').Pool)({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const router = express.Router();
// Register
router.post('/register', async (req, res) => {
  const { username, name, email, password, role, coachId, inviteCode } = req.body;

  try {

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    // Create profile based on role
    if (role === 'coach') {
      await prisma.coachProfile.create({
        data: {
          userId: user.id,
          name: user.name
        }
      });
    } else if (role === 'client') {
      const invite = await prisma.Invitation.findUnique({
        where: {inviteCode: inviteCode}
      });

      
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
          name: user.name,
          coachId: invite.coachId
        }
      });
      await prisma.Invitation.update({
        where: { id: invite.id },
        data: { isUsed: true }
       });
    }

    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


// Validate invite code
router.get('/validate-invite/:code', async(req,res)=>{
  try{

    const invite = await prisma.Invitation.findUnique({
      where: {inviteCode: req.params.code}
    })
    if(!invite){
      return res.status(404).json({error: 'something went wrong'})
    }
    if(invite.isUsed){
      return res.status(400).json({error: 'Invite code already used'})  
    }
  
    res.json({ coachId: invite.coachId });
  } catch(error){
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


module.exports = router;