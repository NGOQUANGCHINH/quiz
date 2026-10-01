import { Router } from 'express';
import multer from 'multer';
import { getQuizzes, getQuizById, importQuiz, saveQuiz, deleteQuiz } from '../controllers/quizController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.post('/', saveQuiz);
router.post('/import', upload.single('file'), importQuiz);
router.delete('/:id', deleteQuiz);

export default router;
