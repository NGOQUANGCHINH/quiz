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

export interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

export interface ProgressData {
  id: string;
  quizId: string;
  title: string;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> answerId
  markedQuestions: string[]; // array of questionIds
  timestamp: number;
}
