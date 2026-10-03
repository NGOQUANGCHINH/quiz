import { Request, Response } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/fileStorage';
import { QuizData } from '../types';
import { ParserFactory } from '../parsers/parserFactory';

const QUIZ_SOURCES = [
  { file: 'dien-toan-dam-may.json', id: '9ded75fa-c744-4e8a-a594-03ec54ec4eda', title: 'Điện toán đám mây và ứng dụng HUBT - Update 2025' },
  { file: 'dien-toan-dam-may-update-2025.json', id: '841065c2-8390-41cb-8b91-e4aaacea3b83', title: 'ĐIỆN TOÁN ĐÁM MÂY VÀ ỨNG DỤNG HUBT - UPDATE 2025' },
  { file: 'ma-nguon-mo.json', id: '2d83d1d8-5acc-415e-8d75-92a4f9b5ce2d', title: 'Mã nguồn mở HUBT - Update 2025' }
];

const loadDynamicQuizzes = (): QuizData[] => {
  return QUIZ_SOURCES.map(source => {
    const questions = readJsonFile<any[]>(source.file, []);
    return {
      id: source.id,
      title: source.title,
      questions: questions
    };
  });
};

export const getQuizzes = (req: Request, res: Response) => {
  const quizzes = loadDynamicQuizzes();
  const summary = quizzes.map(q => ({
    id: q.id,
    title: q.title,
    questionCount: q.questions.length
  }));
  res.json(summary);
};

export const getQuizById = (req: Request, res: Response) => {
  const quizzes = loadDynamicQuizzes();
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
