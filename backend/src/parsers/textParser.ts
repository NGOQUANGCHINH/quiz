import { QuizData, Question, Answer } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function parseTextToQuiz(text: string, title: string): QuizData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const questions: Question[] = [];
  let currentQuestion: Partial<Question> | null = null;
  let currentAnswers: Answer[] = [];
  let currentCorrectAnswerId: string | null = null;
  
  const questionRegex = /^câu\s*\d+[\.\:\-]?\s*(.*)/i;
  const answerRegex = /^(\*?)([a-d])[\.\:\)]?\s*(.*)/i;

  let tempQuestionText: string[] = [];

  const finalizeQuestion = () => {
    if (currentQuestion && (tempQuestionText.length > 0 || currentAnswers.length > 0)) {
      if (tempQuestionText.length > 0) {
        currentQuestion.question = tempQuestionText.join('\n');
      }
      currentQuestion.answers = currentAnswers;
      currentQuestion.correctAnswerId = currentCorrectAnswerId;
      questions.push(currentQuestion as Question);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if it's a new question
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      finalizeQuestion();
      currentQuestion = {
        id: uuidv4(),
        question: '',
        answers: [],
        correctAnswerId: null
      };
      currentAnswers = [];
      currentCorrectAnswerId = null;
      tempQuestionText = [qMatch[1].trim()];
      continue;
    }

    // If it's an answer
    const aMatch = line.match(answerRegex);
    if (aMatch && currentQuestion) {
      const isCorrect = aMatch[1] === '*';
      const letter = aMatch[2];
      const text = aMatch[3];
      
      const answerId = uuidv4();
      const ansText = text.trim();
      currentAnswers.push({
        id: answerId,
        text: ansText
      });
      
      if (isCorrect) {
        currentCorrectAnswerId = answerId;
      }
      continue;
    }

    // If it's just text, and we have a current question but no answers yet, it's part of the question.
    if (currentQuestion) {
      if (currentAnswers.length === 0) {
        tempQuestionText.push(line);
      } else {
        // It might be a continuation of the last answer.
        const lastAnswer = currentAnswers[currentAnswers.length - 1];
        lastAnswer.text += '\n' + line;
      }
    }
  }

  finalizeQuestion();

  return {
    id: uuidv4(),
    title: title.replace(/\.[^/.]+$/, ""), // remove extension
    questions
  };
}
