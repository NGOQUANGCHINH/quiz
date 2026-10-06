import React, { useState } from 'react';
import type {  ProgressData  } from '../types';
import { ArrowLeft, Check, X } from 'lucide-react';
import { formatQuestionText } from './QuizTaking';

interface Props {
  progress: ProgressData;
  navigate: (page: string, params?: any) => void;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizReview({ progress, navigate }: Props) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');

  const questions = progress.questions.filter(q => {
    const ansId = progress.answers[q.id];
    const isCorrect = ansId === q.correctAnswerId;
    if (filter === 'all') return true;
    if (filter === 'correct') return ansId && isCorrect;
    if (filter === 'wrong') return ansId && !isCorrect;
    if (filter === 'unanswered') return !ansId;
    return true;
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-neutral" onClick={() => navigate('result', { progress })}>
          <ArrowLeft /> Quay lại kết quả
        </button>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Xem lại bài: {progress.title}</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-neutral'}`} onClick={() => setFilter('all')}>Tất cả</button>
        <button className={`btn ${filter === 'correct' ? 'btn-primary' : 'btn-neutral'}`} onClick={() => setFilter('correct')}>Đúng</button>
        <button className={`btn ${filter === 'wrong' ? 'btn-primary' : 'btn-neutral'}`} onClick={() => setFilter('wrong')}>Sai</button>
        <button className={`btn ${filter === 'unanswered' ? 'btn-primary' : 'btn-neutral'}`} onClick={() => setFilter('unanswered')}>Chưa làm</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {questions.map((q, idx) => {
          const selectedId = progress.answers[q.id];
          const isCorrect = selectedId === q.correctAnswerId;

          // Find original index in progress.questions to display correct question number
          const originalIdx = progress.questions.findIndex(origQ => origQ.id === q.id);

          return (
            <div key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>Câu {originalIdx + 1}</h3>
                {selectedId ? (
                  isCorrect ? 
                    <span style={{ color: 'var(--correct-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}><Check /> Đúng</span> : 
                    <span style={{ color: 'var(--wrong-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}><X /> Sai</span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Chưa làm</span>
                )}
              </div>

              <div 
                style={{ fontSize: '1.1rem', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: formatQuestionText(q.question) }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {q.answers.map((ans, aIdx) => {
                  const isSelected = selectedId === ans.id;
                  const isActuallyCorrect = q.correctAnswerId === ans.id;

                  let bgColor = 'var(--surface-color)';
                  let borderColor = 'var(--border-color)';
                  let icon = null;

                  if (isActuallyCorrect) {
                    bgColor = 'var(--correct-bg)';
                    borderColor = 'var(--correct-color)';
                    icon = <Check style={{ color: 'var(--correct-color)' }} />;
                  } else if (isSelected) {
                    bgColor = 'var(--wrong-bg)';
                    borderColor = 'var(--wrong-color)';
                    icon = <X style={{ color: 'var(--wrong-color)' }} />;
                  }

                  return (
                    <div key={ans.id} style={{ 
                      padding: '1rem', 
                      borderRadius: '0.5rem', 
                      border: `2px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem'
                    }}>
                      <div style={{ 
                        width: '24px', height: '24px', 
                        borderRadius: '50%', 
                        border: `1px solid ${borderColor}`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        flexShrink: 0,
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        backgroundColor: isActuallyCorrect ? 'var(--correct-color)' : (isSelected ? 'var(--wrong-color)' : 'transparent'),
                        color: (isActuallyCorrect || isSelected) ? 'white' : 'inherit'
                      }}>
                        {LABELS[aIdx]}
                      </div>
                      <div style={{ flex: 1, whiteSpace: 'pre-wrap', marginTop: '1px' }}>
                        {ans.text}
                      </div>
                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Similarity Suggestion Feature - Simple Mock Implementation */}
              {/* This feature would require NLP or a similarity matching logic on backend. For now, it's a structural placeholder or simple text check. */}
              {/* <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', color: 'var(--primary-color)' }}>
                💡 <strong>Gợi ý ghi nhớ:</strong> Câu này hay nhầm lẫn với...
              </div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
