import React, { useMemo } from 'react';
import type {  ProgressData, QuizResult as ResultType  } from '../types';
import { ArrowLeft, RotateCcw, Eye, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
import { shuffleQuestions, shuffleAnswers } from '../utils/shuffle';

interface Props {
  progress: ProgressData;
  navigate: (page: string, params?: any) => void;
}

export default function QuizResult({ progress, navigate }: Props) {
  const result = useMemo<ResultType>(() => {
    let correct = 0;
    let wrong = 0;
    const total = progress.questions.length;
    const unanswered = total - Object.keys(progress.answers).length;

    progress.questions.forEach(q => {
      const ansId = progress.answers[q.id];
      if (ansId) {
        if (ansId === q.correctAnswerId) {
          correct++;
        } else {
          wrong++;
        }
      }
    });

    const percentage = total > 0 ? (correct / total) * 100 : 0;
    const score = (correct / total) * 10;
    const timeSpentSeconds = Math.floor((Date.now() - progress.timestamp) / 1000);

    return { total, correct, wrong, unanswered, score, percentage, timeSpentSeconds };
  }, [progress]);

  const handleRetakeAll = async () => {
    let newQuestions = [...progress.questions];
    
    if (progress.config.shuffleQuestions) {
      newQuestions = shuffleQuestions(newQuestions);
    }
    
    if (progress.config.shuffleAnswers) {
      newQuestions = newQuestions.map(q => ({
        ...q,
        answers: shuffleAnswers([...q.answers])
      }));
    }

    const newProgress: ProgressData = {
      ...progress,
      id: uuidv4(),
      questions: newQuestions,
      currentQuestionIndex: 0,
      answers: {},
      markedQuestions: [],
      timestamp: Date.now()
    };
    await api.saveProgress(newProgress);
    navigate('taking', { progress: newProgress });
  };

  const handleRetakeWrong = async () => {
    let wrongQuestions = progress.questions.filter(q => {
      const ansId = progress.answers[q.id];
      return ansId !== q.correctAnswerId;
    });

    if (wrongQuestions.length === 0) return;

    if (progress.config.shuffleQuestions) {
      wrongQuestions = shuffleQuestions(wrongQuestions);
    }
    
    if (progress.config.shuffleAnswers) {
      wrongQuestions = wrongQuestions.map(q => ({
        ...q,
        answers: shuffleAnswers([...q.answers])
      }));
    }

    const newProgress: ProgressData = {
      ...progress,
      id: uuidv4(),
      currentQuestionIndex: 0,
      answers: {},
      markedQuestions: [],
      timestamp: Date.now(),
      questions: wrongQuestions, // Only wrong and unanswered
      config: {
        ...progress.config,
        questionCount: 'all'
      }
    };
    await api.saveProgress(newProgress);
    navigate('taking', { progress: newProgress });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button className="btn btn-neutral" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('dashboard')}>
        <ArrowLeft /> Về trang chủ
      </button>

      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '2rem', color: 'var(--primary-color)' }}>KẾT QUẢ BÀI THI</h2>
        
        <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          {result.correct} / {result.total} <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>câu đúng</span>
        </div>

        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Điểm: {result.score.toFixed(1)} / 10</div>
        <div style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>{result.percentage.toFixed(1)}%</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: 'var(--correct-color)', fontWeight: 'bold' }}>{result.correct}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Đúng</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: 'var(--wrong-color)', fontWeight: 'bold' }}>{result.wrong}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Sai</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{result.unanswered}</div>
            <div style={{ color: 'var(--text-secondary)' }}>Chưa làm</div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
          Thời gian làm bài: {formatTime(result.timeSpentSeconds)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('review', { progress })}>
            <Eye /> Xem lại bài
          </button>
          <button className="btn btn-outline" onClick={handleRetakeWrong} disabled={result.wrong + result.unanswered === 0}>
            <XCircle /> Làm lại câu sai
          </button>
          <button className="btn btn-neutral" onClick={handleRetakeAll}>
            <RotateCcw /> Làm lại toàn bộ
          </button>
        </div>
      </div>
    </div>
  );
}
