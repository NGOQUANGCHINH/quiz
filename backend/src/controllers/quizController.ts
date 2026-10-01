import { Request, Response } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/fileStorage';
import { QuizData } from '../types';
import { ParserFactory } from '../parsers/parserFactory';

const QUIZZES_FILE = 'quizzes.json';

export const getQuizzes = (req: Request, res: Response) => {
  const quizzes = readJsonFile<QuizData[]>(QUIZZES_FILE, []);
  // Return without full questions to save bandwidth on listing
  const summary = quizzes.map(q => ({
    id: q.id,
    title: q.title,
    questionCount: q.questions.length
  }));
  res.json(summary);
};

export const getQuizById = (req: Request, res: Response) => {
  const quizzes = readJsonFile<QuizData[]>(QUIZZES_FILE, []);
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (quiz) {
    res.json(quiz);
  } else {
    res.status(404).json({ message: 'Quiz not found' });
  }
};

export const importQuiz = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { mimetype, originalname, buffer } = req.file;
    const parser = ParserFactory.getParser(mimetype, originalname);
    const quizData = await parser.parse(buffer, originalname);

    res.json(quizData); // return for preview
  } catch (error: any) {
    console.error('Error importing quiz:', error);
    res.status(500).json({ message: 'Failed to import quiz', error: error.message });
  }
};

export const saveQuiz = (req: Request, res: Response) => {
  const newQuiz: QuizData = req.body;
  const quizzes = readJsonFile<QuizData[]>(QUIZZES_FILE, []);
  
  const existingIndex = quizzes.findIndex(q => q.id === newQuiz.id);
  if (existingIndex >= 0) {
    quizzes[existingIndex] = newQuiz;
  } else {
    quizzes.push(newQuiz);
  }
  
  writeJsonFile(QUIZZES_FILE, quizzes);
  res.json({ message: 'Saved successfully', id: newQuiz.id });
};

export const deleteQuiz = (req: Request, res: Response) => {
  let quizzes = readJsonFile<QuizData[]>(QUIZZES_FILE, []);
  quizzes = quizzes.filter(q => q.id !== req.params.id);
  writeJsonFile(QUIZZES_FILE, quizzes);
  res.json({ message: 'Deleted successfully' });
};
