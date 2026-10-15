import type {  Quiz, QuizSummary, ProgressData  } from '../types';

const getBaseUrl = () => import.meta.env.BASE_URL || '/';

export const api = {
  getQuizzes: async (): Promise<(QuizSummary & { fileUrl?: string })[]> => {
    const res = await fetch(`${getBaseUrl()}data/quizzes.json?t=${Date.now()}`);
    return res.json();
  },
  
  getQuizById: async (id: string): Promise<Quiz> => {
    const quizzes = await api.getQuizzes();
    const quizInfo = quizzes.find(q => q.id === id);
    if (!quizInfo || !quizInfo.fileUrl) {
      throw new Error('Quiz not found');
    }
    const res = await fetch(`${getBaseUrl()}data/${quizInfo.fileUrl}?t=${Date.now()}`);
    if (!res.ok) throw new Error('Failed to fetch quiz');
    return res.json();
  },

  importQuiz: async (file: File): Promise<Quiz> => {
    throw new Error('Import is not supported in static mode');
  },

  saveQuiz: async (quiz: Quiz): Promise<void> => {
    throw new Error('Save quiz is not supported in static mode');
  },

  getProgressList: async (): Promise<ProgressData[]> => {
    const raw = localStorage.getItem('quiz_progress');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveProgressSync: (progress: ProgressData): void => {
    try {
      const raw = localStorage.getItem('quiz_progress');
      const list: ProgressData[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(p => p.id === progress.id);
      if (idx >= 0) {
        list[idx] = progress;
      } else {
        list.push(progress);
      }
      localStorage.setItem('quiz_progress', JSON.stringify(list));
      sessionStorage.setItem('quiz-progress-data', JSON.stringify(progress));
      window.dispatchEvent(new Event('progress-updated'));
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  },

  saveProgress: async (progress: ProgressData): Promise<void> => {
    api.saveProgressSync(progress);
  },

  deleteProgress: async (id: string): Promise<void> => {
    try {
      let list = await api.getProgressList();
      list = list.filter(p => p.id !== id);
      localStorage.setItem('quiz_progress', JSON.stringify(list));
      sessionStorage.removeItem('quiz-progress-data');
      window.dispatchEvent(new Event('progress-updated'));
    } catch (err) {
      console.error('Failed to delete progress:', err);
    }
  }
};
