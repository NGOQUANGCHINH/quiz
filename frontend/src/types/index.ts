export interface Answer {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  question: string;
  answers: Answer[];
  correctAnswerId: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface QuizSummary {
  id: string;
  title: string;
  questionCount: number;
}

export interface ProgressData {
  id: string;
  quizId: string;
  title: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  markedQuestions: string[];
  timestamp: number;
  config: QuizConfig;
  questions: Question[]; // Need to store selected/shuffled questions
}

export interface QuizConfig {
  questionCount: number | 'all';
  startIdx?: number;
  endIdx?: number;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  timeLimitMinutes: number | null; // null means no limit
  mode: 'exam' | 'practice';
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  percentage: number;
  timeSpentSeconds: number;
}
