import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth';
import calendarRoutes from './routes/calendar';
import goalRoutes from './routes/goals';
import taskRoutes from './routes/tasks';

// Get version from environment variable or default to 1.0.0
const version = process.env.APP_VERSION?.trim() || '1.0.0';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: version,
    timestamp: new Date().toISOString(),
  });
});

export default app;
