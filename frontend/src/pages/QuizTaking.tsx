import React, { useState, useEffect, useCallback } from 'react';
import type {  ProgressData, Question  } from '../types';
import { api } from '../utils/api';
import { Bookmark, ChevronLeft, ChevronRight, Send, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import classNames from 'classnames';

interface Props {
  progress: ProgressData;
  navigate: (page: string, params?: any) => void;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Trả về text đáp án nguyên bản, không bôi màu đỏ
const highlightDiffs = (answers: { id: string; text: string }[]) => {
  return answers.map(a => a.text);
};


const formatQuestionText = (text: string) => {
  // Render code blocks, and inside them highlight the "key" lines
  let html = text.replace(/```[a-z]*\n([\s\S]*?)\n?```/gi, (_match, code: string) => {
    const lines = code.split('\n');
    const highlighted = lines.map(line => {
      const trimmed = line.trim();
      // Key lines: contain operators or expressions that are typically the "point" of the code
      const isKeyLine = /(\+\+|--|[+\-*\/]=|\bcout\b|\bcin\b|\breturn\b|\bif\b|\bfor\b|\bwhile\b)/.test(trimmed)
        && trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('int main') && !trimmed.startsWith('{') && !trimmed.startsWith('}');
      if (isKeyLine) {
        return `<strong style="color: var(--primary-color);">${line}</strong>`;
      }
      return line;
    });
    return `<pre class="code-block"><code>${highlighted.join('\n')}</code></pre>`;
  });
  
  // Danh sách các từ khóa quan trọng cần bôi đậm (chỉ bôi đậm, không đổi màu)
  const importantKeywords = /\b(không được|ngoại trừ|ngoại lệ|không thể|không|chưa|sai|nhất|tất cả|chỉ|duy nhất|luôn luôn|bắt buộc|tối đa|tối thiểu|cơ bản|chủ yếu|đặc trưng|quan trọng|bao gồm|chức năng|mục đích|nguyên tắc|tính chất|phân biệt|nào sau đây|là gì|tại sao|như thế nào|khi nào|đúng|chính xác)\b/gi;
  
  // Bảo vệ cả code blocks VÀ các thẻ <span style='color:red'> đã có (từ JSON - bôi đỏ điểm khác biệt)
  const codeBlocks: string[] = [];
  html = html.replace(/<pre class="code-block"><code>[\s\S]*?<\/code><\/pre>/gi, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  // Bảo vệ span đỏ từ JSON (cả single-quote và double-quote variants)
  html = html.replace(/<span style=['"]color:red['"]>[\s\S]*?<\/span>/gi, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Bôi đậm từ khóa trong phần text thường (đã bảo vệ span đỏ)
  html = html.replace(importantKeywords, '<strong>$&</strong>');

  // Khôi phục lại tất cả protected blocks
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[parseInt(index)];
  });

  return html;
};

export default function QuizTaking({ progress: initialProgress, navigate }: Props) {
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    initialProgress.config.timeLimitMinutes ? initialProgress.config.timeLimitMinutes * 60 : null
  );
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(window.innerWidth > 768);

  const totalQuestions = progress.questions.length;
  const currentQIndex = progress.currentQuestionIndex;
  const currentQuestion = progress.questions[currentQIndex];
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      const latestQuiz = await api.getQuizById(progress.quizId);
      if (latestQuiz) {
        setProgress(prev => {
          const updatedQuestions = prev.questions.map(oldQ => {
            const newQ = latestQuiz.questions.find(q => q.id === oldQ.id);
            return newQ ? { ...oldQ, ...newQ } : oldQ;
          });
          return { ...prev, questions: updatedQuestions };
        });
      }
    } catch (e) {
      console.error(e);
    }
    setIsReloading(false);
  };

  // Auto save
  useEffect(() => {
    sessionStorage.setItem('quiz-progress-data', JSON.stringify(progress));
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

    if (progress.config.autoNextQuestion) {
      const savedIndex = currentQIndex;
      setTimeout(() => {
        setProgress(prev => {
          if (prev.currentQuestionIndex === savedIndex && prev.currentQuestionIndex < totalQuestions - 1) {
            return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
          }
          return prev;
        });
      }, 1000);
    }
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

  useEffect(() => {
    const handleGlobalUpdate = () => {
      handleReload();
    };
    window.addEventListener('global-update', handleGlobalUpdate);
    return () => window.removeEventListener('global-update', handleGlobalUpdate);
  }, [progress.quizId, isReloading]); // Add dependencies needed by handleReload

  // Layout styles
  const gridTemplate = '1fr 300px';

  return (
    <div className="quiz-taking-grid">
      {/* Left Area - Question */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="quiz-header-row">
          <div className="quiz-header-group">
            <button className="btn btn-neutral" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('dashboard')}>
              <ArrowLeft /> Quay lại
            </button>
            {isReloading && <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Đang cập nhật...</span>}
          </div>
          <div className="quiz-header-group">
            <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Câu {currentQIndex + 1} / {totalQuestions}</h3>
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

        <div className="card" style={{ flex: 1, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div 
            style={{ fontSize: '1.2rem', marginBottom: '2rem', whiteSpace: 'pre-wrap', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: formatQuestionText(currentQuestion.question) }}
          />
          {currentQuestion.image && (
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <img 
                src={`${import.meta.env.BASE_URL}${currentQuestion.image.startsWith('/') ? currentQuestion.image.slice(1) : currentQuestion.image}`} 
                alt="Question figure" 
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>
            {(() => {
              const diffHighlighted = highlightDiffs(currentQuestion.answers);
              return currentQuestion.answers.map((ans, idx) => {
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
                  <div style={{ flex: 1, whiteSpace: 'pre-wrap', marginTop: '3px' }}
                    dangerouslySetInnerHTML={{ __html: diffHighlighted[idx] }}
                  />
                    
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
              });
            })()}
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
      <div className="quiz-right-area">
        <div className="card quiz-question-list-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0, marginBottom: '1rem' }}>
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

        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: showQuestionList ? '1rem' : 0, flexShrink: 0 }}
          onClick={() => setShowQuestionList(!showQuestionList)}
        >
          <h3 style={{ margin: 0 }}>Danh sách câu</h3>
          <div style={{ color: 'var(--text-secondary)' }}>{showQuestionList ? '▲' : '▼'}</div>
        </div>

        {showQuestionList && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.5rem', alignContent: 'flex-start', paddingRight: '0.5rem' }}>
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
        )}
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
          <div className="card" style={{ width: '90%', maxWidth: '450px', textAlign: 'center' }}>
            <AlertTriangle style={{ width: '48px', height: '48px', color: 'var(--wrong-color)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '1rem' }}>Bạn chưa hoàn thành bài!</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Vẫn còn {totalQuestions - Object.keys(progress.answers).length} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-neutral" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={() => setShowSubmitConfirm(false)}>
                Làm tiếp
              </button>
              <button className="btn btn-primary" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={() => handleSubmit(true)}>
                Vẫn nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
