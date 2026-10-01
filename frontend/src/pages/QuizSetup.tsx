import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type {  Quiz, QuizConfig, ProgressData  } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft } from 'lucide-react';
import { shuffleQuestions, shuffleAnswers } from '../utils/shuffle';

interface Props {
  quizId: string;
  navigate: (page: string, params?: any) => void;
}

export default function QuizSetup({ quizId, navigate }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 'all',
    randomizeQuestions: true,
    randomizeAnswers: true,
    timeLimitMinutes: null,
    mode: 'exam'
  });

  useEffect(() => {
    api.getQuizById(quizId).then(setQuiz);
  }, [quizId]);

  const handleStart = async () => {
    if (!quiz) return;

    let selectedQuestions = [...quiz.questions];

    if (config.questionCount !== 'all') {
        // Just take the first N questions before shuffling if not randomizing, 
        // but if randomizing, we shuffle first then take N.
        if (config.randomizeQuestions) {
            selectedQuestions = shuffleQuestions(selectedQuestions);
        }
        selectedQuestions = selectedQuestions.slice(0, config.questionCount as number);
    } else {
        if (config.randomizeQuestions) {
            selectedQuestions = shuffleQuestions(selectedQuestions);
        }
    }

    if (config.randomizeAnswers) {
        selectedQuestions = selectedQuestions.map(q => ({
            ...q,
            answers: shuffleAnswers([...q.answers])
        }));
    }

    const newProgress: ProgressData = {
      id: uuidv4(),
      quizId: quiz.id,
      title: quiz.title,
      currentQuestionIndex: 0,
      answers: {},
      markedQuestions: [],
      timestamp: Date.now(),
      config,
      questions: selectedQuestions
    };

    await api.saveProgress(newProgress);
    navigate('taking', { progress: newProgress });
  };

  if (!quiz) return <div>Đang tải...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button className="btn btn-neutral" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('dashboard')}>
        <ArrowLeft /> Quay lại
      </button>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Cấu hình bài thi: {quiz.title}</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Tổng số: {quiz.questions.length} câu</p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chế độ</label>
          <select 
            className="input" 
            value={config.mode} 
            onChange={e => setConfig({...config, mode: e.target.value as 'exam' | 'practice'})}
          >
            <option value="exam">Thi thử (Chấm điểm cuối cùng)</option>
            <option value="practice">Ôn tập (Hiện đáp án ngay)</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Số lượng câu hỏi</label>
          <select 
            className="input" 
            value={config.questionCount} 
            onChange={e => setConfig({...config, questionCount: e.target.value === 'all' ? 'all' : parseInt(e.target.value)})}
          >
            <option value="all">Toàn bộ ({quiz.questions.length} câu)</option>
            <option value={20}>20 câu</option>
            <option value={30}>30 câu</option>
            <option value={50}>50 câu</option>
            <option value={100}>100 câu</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thời gian làm bài (phút)</label>
          <select 
            className="input" 
            value={config.timeLimitMinutes || 'none'} 
            onChange={e => setConfig({...config, timeLimitMinutes: e.target.value === 'none' ? null : parseInt(e.target.value)})}
          >
            <option value="none">Không giới hạn</option>
            <option value={15}>15 phút</option>
            <option value={30}>30 phút</option>
            <option value={45}>45 phút</option>
            <option value={60}>60 phút</option>
            <option value={90}>90 phút</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.randomizeQuestions} 
              onChange={e => setConfig({...config, randomizeQuestions: e.target.checked})}
              style={{ width: '18px', height: '18px' }}
            />
            Đảo thứ tự câu hỏi
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={config.randomizeAnswers} 
              onChange={e => setConfig({...config, randomizeAnswers: e.target.checked})}
              style={{ width: '18px', height: '18px' }}
            />
            Đảo thứ tự đáp án
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={handleStart}>
          Bắt đầu làm bài
        </button>
      </div>
    </div>
  );
}
