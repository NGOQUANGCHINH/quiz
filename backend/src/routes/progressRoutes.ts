import { Router } from 'express';
import { getProgress, saveProgress, deleteProgress } from '../controllers/progressController';

const router = Router();

router.get('/', getProgress);
router.post('/', saveProgress);
router.delete('/:id', deleteProgress);

export default router;
