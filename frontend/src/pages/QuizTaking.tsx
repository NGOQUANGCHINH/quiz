import React, { useState, useEffect, useCallback } from 'react';
import type {  ProgressData, Question  } from '../types';
import { api } from '../utils/api';
import { Bookmark, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';

interface Props {
  progress: ProgressData;
  navigate: (page: string, params?: any) => void;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizTaking({ progress: initialProgress, navigate }: Props) {
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    initialProgress.config.timeLimitMinutes ? initialProgress.config.timeLimitMinutes * 60 : null
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const totalQuestions = progress.questions.length;
  const currentQIndex = progress.currentQuestionIndex;
  const currentQuestion = progress.questions[currentQIndex];

  // Auto save
  useEffect(() => {
    const timer = setTimeout(() => {
      api.saveProgress(progress);
    }, 2000); // debounce 2s
    return () => clearTimeout(timer);
  }, [progress]);

  // Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft(t => t !== null ? t - 1 : null), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleSelectAnswer = (answerId: string) => {
    setProgress(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: answerId }
    }));
  };

  const toggleMark = () => {
    setProgress(prev => {
      const qId = currentQuestion.id;
      const isMarked = prev.markedQuestions.includes(qId);
      return {
        ...prev,
        markedQuestions: isMarked 
          ? prev.markedQuestions.filter(id => id !== qId)
          : [...prev.markedQuestions, qId]
      };
    });
  };

  const changeQuestion = (idx: number) => {
    if (idx >= 0 && idx < totalQuestions) {
      setProgress(prev => ({ ...prev, currentQuestionIndex: idx }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch(e.key) {
        case 'ArrowLeft': changeQuestion(currentQIndex - 1); break;
        case 'ArrowRight':
        case 'Enter': changeQuestion(currentQIndex + 1); break;
        case 'b':
        case 'B': toggleMark(); break;
        case '1': if(currentQuestion.answers[0]) handleSelectAnswer(currentQuestion.answers[0].id); break;
        case '2': if(currentQuestion.answers[1]) handleSelectAnswer(currentQuestion.answers[1].id); break;
        case '3': if(currentQuestion.answers[2]) handleSelectAnswer(currentQuestion.answers[2].id); break;
        case '4': if(currentQuestion.answers[3]) handleSelectAnswer(currentQuestion.answers[3].id); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQIndex, currentQuestion]);

  const handleSubmit = (force: boolean = false) => {
    const unansweredCount = totalQuestions - Object.keys(progress.answers).length;
    if (unansweredCount > 0 && !force) {
      setShowSubmitConfirm(true);
    } else {
      // API call to delete progress since it's done
      api.deleteProgress(progress.id).then(() => {
        navigate('result', { progress });
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Layout styles
  const gridTemplate = '1fr 300px';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: '2rem', height: 'calc(100vh - 11rem)', overflow: 'hidden' }}>
      {/* Left Area - Question */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
          <h3>Câu {currentQIndex + 1} / {totalQuestions}</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {timeLeft !== null && (
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--wrong-color)' : 'inherit' }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
            <button 
              className={classNames('btn', progress.markedQuestions.includes(currentQuestion.id) ? '' : 'btn-outline')} 
              style={progress.markedQuestions.includes(currentQuestion.id) ? { backgroundColor: 'var(--warning-color)', color: '#000', border: '1px solid var(--warning-color)' } : {}}
              onClick={toggleMark}
            >
              <Bookmark /> Đánh dấu (B)
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: 1, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '2rem', whiteSpace: 'pre-wrap', flexShrink: 0 }}>
            {currentQuestion.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
            {currentQuestion.answers.map((ans, idx) => {
              const hasAnswered = !!progress.answers[currentQuestion.id];
              const isSelected = progress.answers[currentQuestion.id] === ans.id;
              const isActuallyCorrect = ans.id === currentQuestion.correctAnswerId;
              
              let bgColor = 'var(--surface-color)';
              let borderColor = 'var(--border-color)';
              let textColor = 'inherit';
              let circleBg = 'transparent';
              let circleColor = 'inherit';
              let circleBorder = 'var(--border-color)';
              
              if (isSelected) {
                bgColor = 'var(--primary-light)';
                borderColor = 'var(--primary-color)';
                circleBg = 'var(--primary-color)';
                circleColor = 'white';
                circleBorder = 'transparent';
              }

              // Chế độ ôn tập: hiện màu ngay khi đã chọn đáp án
              if (progress.config.mode === 'practice' && hasAnswered) {
                if (isActuallyCorrect) {
                  bgColor = 'var(--correct-bg)';
                  borderColor = 'var(--correct-color)';
                  circleBg = 'var(--correct-color)';
                  circleColor = 'white';
                  circleBorder = 'transparent';
                } else if (isSelected) {
                  bgColor = 'var(--wrong-bg)';
                  borderColor = 'var(--wrong-color)';
                  circleBg = 'var(--wrong-color)';
                  circleColor = 'white';
                  circleBorder = 'transparent';
                }
              }

              return (
                <div 
                  key={ans.id}
                  onClick={() => !hasAnswered && handleSelectAnswer(ans.id)}
                  style={{ 
                    padding: '1rem', 
                    border: `2px solid ${borderColor}`,
                    borderRadius: '0.5rem',
                    cursor: hasAnswered ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    backgroundColor: bgColor,
                    color: textColor,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '30px', height: '30px', 
                    borderRadius: '50%', 
                    border: `1px solid ${circleBorder}`,
                    backgroundColor: circleBg,
                    color: circleColor,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold'
                  }}>
                    {LABELS[idx]}
                  </div>
                  <div style={{ flex: 1, whiteSpace: 'pre-wrap', marginTop: '3px' }}>
                    {ans.text}
                  </div>
                  
                  {progress.config.mode === 'practice' && hasAnswered && (
                    <>
                      {isActuallyCorrect && (
                        <div style={{ fontWeight: 'bold', color: 'var(--correct-color)' }}>
                          ✓ Đúng
                        </div>
                      )}
                      {isSelected && !isActuallyCorrect && (
                        <div style={{ fontWeight: 'bold', color: 'var(--wrong-color)' }}>
                          ✗ Sai
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(Object.keys(progress.answers).length / totalQuestions) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s' }}></div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Đã làm: {Object.keys(progress.answers).length} / {totalQuestions}
          </div>
        </div>


      </div>

      {/* Right Area - Question List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', height: '100%', overflow: 'hidden' }}>
        <h3 style={{ marginBottom: '1rem', textAlign: 'center', flexShrink: 0 }}>Danh sách câu</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignContent: 'flex-start' }}>
          {progress.questions.map((q, idx) => {
            const isAnswered = !!progress.answers[q.id];
            const isMarked = progress.markedQuestions.includes(q.id);
            const isCurrent = idx === currentQIndex;

            let bg = 'var(--surface-color)';
            let border = 'var(--border-color)';
            let color = 'var(--text-primary)';

            if (isAnswered) {
              if (progress.config.mode === 'practice') {
                const isCorrect = progress.answers[q.id] === q.correctAnswerId;
                bg = isCorrect ? 'var(--correct-bg)' : 'var(--wrong-bg)';
                border = isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)';
              } else {
                bg = 'var(--primary-light)';
                border = 'var(--primary-color)';
              }
            }
            
            if (isCurrent) {
              if (progress.config.mode === 'practice' && isAnswered) {
                const isCorrect = progress.answers[q.id] === q.correctAnswerId;
                bg = isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)';
                border = bg;
                color = 'white';
              } else {
                border = 'var(--primary-color)';
                bg = 'var(--primary-color)';
                color = 'white';
              }
            }

            return (
              <div 
                key={q.id} 
                onClick={() => changeQuestion(idx)}
                style={{
                  width: '40px', height: '40px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  borderRadius: '0.25rem',
                  border: `2px solid ${border}`,
                  backgroundColor: bg,
                  color: color,
                  cursor: 'pointer',
                  position: 'relative',
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  userSelect: 'none'
                }}
              >
                {idx + 1}
                {isMarked && (
                  <div style={{ position: 'absolute', top: -4, right: -4, color: 'var(--warning-color)' }}>
                    <Bookmark style={{ width: '14px', height: '14px' }} fill="currentColor" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-neutral" style={{ flex: 1, padding: '0.75rem 0.5rem' }} disabled={currentQIndex === 0} onClick={() => changeQuestion(currentQIndex - 1)}>
              <ChevronLeft /> Trước
            </button>
            <button className="btn btn-neutral" style={{ flex: 1, padding: '0.75rem 0.5rem' }} disabled={currentQIndex === totalQuestions - 1} onClick={() => changeQuestion(currentQIndex + 1)}>
              Tiếp <ChevronRight />
            </button>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleSubmit(false)}>
            Nộp bài <Send />
          </button>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', textAlign: 'center' }}>
            <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--wrong-color)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '1rem' }}>Bạn chưa hoàn thành bài!</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Vẫn còn {totalQuestions - Object.keys(progress.answers).length} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-neutral" style={{ flex: 1 }} onClick={() => setShowSubmitConfirm(false)}>
                Làm tiếp
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSubmit(true)}>
                Vẫn nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
