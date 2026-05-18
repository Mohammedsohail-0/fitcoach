require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/coach', require('./routes/coach'));
app.use('/client', require('./routes/client'));
app.use('/workout', require('./routes/workout'));

const authMiddleware = require('./middleware/auth');

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You are authorized', user: req.user });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FitCoach API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});