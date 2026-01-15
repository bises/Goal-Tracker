import cors from 'cors';
import express from 'express';
import calendarRoutes from './routes/calendar';
import goalRoutes from './routes/goals';
import taskRoutes from './routes/tasks';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/health', (req, res) => {
    res.send('OK');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
