import express from 'express';
import cors from 'cors';
import quizRoutes from './routes/quizRoutes';
import progressRoutes from './routes/progressRoutes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
