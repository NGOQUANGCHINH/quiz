import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type {  Quiz, QuizConfig, ProgressData  } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { shuffleQuestions, shuffleAnswers } from '../utils/shuffle';

interface Props {
  quizId: string;
  navigate: (page: string, params?: any) => void;
}

const CheckboxOption = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', 
      padding: '0.75rem 1rem', borderRadius: '0.75rem', 
      backgroundColor: checked ? 'var(--primary-light)' : 'var(--surface-color)', 
      border: `2px solid ${checked ? 'var(--primary-color)' : 'var(--border-color)'}`,
      transition: 'all 0.2s',
      flex: '1 1 calc(50% - 1rem)',
      userSelect: 'none'
    }}
  >
    <div style={{ 
      width: '24px', height: '24px', borderRadius: '6px', 
      border: `2px solid ${checked ? 'var(--primary-color)' : 'var(--text-secondary)'}`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backgroundColor: checked ? 'var(--primary-color)' : 'transparent',
      transition: 'all 0.2s',
      flexShrink: 0
    }}>
      {checked && <Check size={16} color="white" strokeWidth={3} />}
    </div>
    <span style={{ fontWeight: checked ? 600 : 500, color: 'var(--text-primary)' }}>
      {label}
    </span>
  </div>
);

export default function QuizSetup({ quizId, navigate }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 'all',
    randomizeQuestions: false,
    randomizeAnswers: false,
    timeLimitMinutes: null,
    mode: 'practice',
    autoNextQuestion: true
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.getQuizById(quizId)
      .then(setQuiz)
      .catch(err => {
        console.error(err);
        setError('Không thể tải bộ đề. Vui lòng kiểm tra lại kết nối hoặc file dữ liệu.');
      });
  }, [quizId]);

  const handleStart = async () => {
    if (!quiz) return;

    let selectedQuestions = [...quiz.questions];

    if (config.questionCount !== 'all') {
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

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <AlertTriangle size={48} color="var(--wrong-color)" style={{ marginBottom: '1rem' }} />
      <h3 style={{ color: 'var(--wrong-color)' }}>{error}</h3>
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('dashboard')}>
        Quay lại trang chủ
      </button>
    </div>
  );

  if (!quiz) return <div>Đang tải...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0 }}>
        <button className="btn btn-neutral" style={{ marginBottom: '1rem' }} onClick={() => navigate('dashboard')}>
          <ArrowLeft /> Quay lại
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>Cấu hình bài thi: {quiz.title}</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Tổng số: {quiz.questions.length} câu hỏi</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', flexShrink: 0 }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Chế độ làm bài</label>
            <select 
              className="custom-select" 
              value={config.mode} 
              onChange={e => setConfig({...config, mode: e.target.value as 'exam' | 'practice'})}
            >
              <option value="exam">Thi thử (Chấm điểm cuối cùng)</option>
              <option value="practice">Ôn tập (Hiện đáp án ngay)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Số lượng câu hỏi</label>
            <select 
              className="custom-select" 
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Thời gian (phút)</label>
            <select 
              className="custom-select" 
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
        </div>

        <div style={{ flexShrink: 0 }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tùy chọn thêm</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <CheckboxOption 
              label="Đảo thứ tự câu hỏi"
              checked={config.randomizeQuestions}
              onChange={(c) => setConfig({...config, randomizeQuestions: c})}
            />
            <CheckboxOption 
              label="Đảo thứ tự đáp án"
              checked={config.randomizeAnswers}
              onChange={(c) => setConfig({...config, randomizeAnswers: c})}
            />
            <CheckboxOption 
              label="Tự động chuyển câu (sau 1s)"
              checked={config.autoNextQuestion || false}
              onChange={(c) => setConfig({...config, autoNextQuestion: c})}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', fontWeight: 'bold' }} onClick={handleStart}>
            Bắt đầu làm bài
          </button>
        </div>
      </div>
    </div>
  );
}
