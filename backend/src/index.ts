import express from 'express';
import cors from 'cors';
import quizRoutes from './routes/quizRoutes';
import progressRoutes from './routes/progressRoutes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

import path from 'path';

app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/img', express.static(path.join(__dirname, 'public/img')));

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
