import type {  Quiz, QuizSummary, ProgressData  } from '../types';

const API_URL = '/api';

export const api = {
  getQuizzes: async (): Promise<QuizSummary[]> => {
    const res = await fetch(`${API_URL}/quizzes`);
    return res.json();
  },
  
  getQuizById: async (id: string): Promise<Quiz> => {
    const res = await fetch(`${API_URL}/quizzes/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quiz');
    return res.json();
  },

  importQuiz: async (file: File): Promise<Quiz> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/quizzes/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Import failed');
    }
    return res.json();
  },

  saveQuiz: async (quiz: Quiz): Promise<void> => {
    await fetch(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
  },

  getProgressList: async (): Promise<ProgressData[]> => {
    const res = await fetch(`${API_URL}/progress`);
    return res.json();
  },

  saveProgress: async (progress: ProgressData): Promise<void> => {
    await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
  },

  deleteProgress: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/progress/${id}`, {
      method: 'DELETE',
    });
  }
};
