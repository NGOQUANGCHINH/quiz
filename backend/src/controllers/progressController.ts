import { Request, Response } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/fileStorage';
import { ProgressData } from '../types';

const PROGRESS_FILE = 'progress.json';

export const getProgress = (req: Request, res: Response) => {
  const progressList = readJsonFile<ProgressData[]>(PROGRESS_FILE, []);
  res.json(progressList);
};

export const saveProgress = (req: Request, res: Response) => {
  const newProgress: ProgressData = req.body;
  newProgress.timestamp = Date.now();
  
  const progressList = readJsonFile<ProgressData[]>(PROGRESS_FILE, []);
  const existingIndex = progressList.findIndex(p => p.id === newProgress.id);
  
  if (existingIndex >= 0) {
    progressList[existingIndex] = newProgress;
  } else {
    progressList.push(newProgress);
  }
  
  writeJsonFile(PROGRESS_FILE, progressList);
  res.json({ message: 'Progress saved', id: newProgress.id });
};

export const deleteProgress = (req: Request, res: Response) => {
  let progressList = readJsonFile<ProgressData[]>(PROGRESS_FILE, []);
  progressList = progressList.filter(p => p.id !== req.params.id);
  writeJsonFile(PROGRESS_FILE, progressList);
  res.json({ message: 'Progress deleted' });
};
