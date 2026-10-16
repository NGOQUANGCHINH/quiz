import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {  ProgressData, Question  } from '../types';
import { api } from '../utils/api';
import { Bookmark, ChevronLeft, ChevronRight, Send, AlertTriangle, ArrowLeft, RefreshCw, Lightbulb, X, RotateCcw, ArrowLeftRight, Check } from 'lucide-react';
import classNames from 'classnames';
import { shuffleQuestions, shuffleAnswers } from '../utils/shuffle';

interface Props {
  progress: ProgressData;
  navigate: (page: string, params?: any) => void;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Trả về text đáp án nguyên bản, không bôi màu đỏ
const highlightDiffs = (answers: { id: string; text: string }[]) => {
  return answers.map(a => a.text);
};


const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const formatQuestionText = (text: string) => {
  // Render code blocks with clean formatting and escaped HTML entities
  let html = text.replace(/```[a-z]*\n([\s\S]*?)\n?```/gi, (_match, code: string) => {
    const spans: string[] = [];
    let cleanCode = code.replace(/<span[^>]*>.*?<\/span>/gi, match => {
      spans.push(match);
      return `__INLINE_SPAN_${spans.length - 1}__`;
    });
    let escapedCode = escapeHtml(cleanCode.trimEnd());
    escapedCode = escapedCode.replace(/__INLINE_SPAN_(\d+)__/g, (_, idx) => spans[parseInt(idx)]);
    return `<pre class="code-block"><code>${escapedCode}</code></pre>`;
  });
  
  // Danh sách các từ khóa quan trọng cần bôi đậm (chỉ bôi đậm, không đổi màu)
  const importantKeywords = /\b(không được|ngoại trừ|ngoại lệ|không thể|không|chưa|sai|nhất|tất cả|chỉ|duy nhất|luôn luôn|bắt buộc|tối đa|tối thiểu|cơ bản|chủ yếu|đặc trưng|quan trọng|bao gồm|chức năng|mục đích|nguyên tắc|tính chất|phân biệt|nào sau đây|là gì|tại sao|như thế nào|khi nào|đúng|chính xác)\b/gi;
  
  // Bảo vệ cả code blocks VÀ các thẻ <span style='...'> đã có
  const codeBlocks: string[] = [];
  html = html.replace(/<pre class="code-block"><code>[\s\S]*?<\/code><\/pre>/gi, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  // Bảo vệ span đã có (cả single-quote và double-quote variants)
  html = html.replace(/<span style=['"][^'"]*['"]>[\s\S]*?<\/span>/gi, match => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Bôi đậm từ khóa trong phần text thường (đã bảo vệ span và code blocks)
  html = html.replace(importantKeywords, '<strong>$&</strong>');

  // Khôi phục lại tất cả protected blocks
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
    return codeBlocks[parseInt(index)];
  });

  return html;
};


export default function QuizTaking({ progress: initialProgress, navigate }: Props) {
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (initialProgress.timeLeftSeconds !== undefined && initialProgress.timeLeftSeconds !== null) {
      return initialProgress.timeLeftSeconds;
    }
    return initialProgress.config.timeLimitMinutes ? initialProgress.config.timeLimitMinutes * 60 : null;
  });
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(window.innerWidth > 768);

  const totalQuestions = progress.questions.length;
  const currentQIndex = progress.currentQuestionIndex;
  const currentQuestion = progress.questions[currentQIndex];
  const [isReloading, setIsReloading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Detect English vocab question
  const isEnglishVocab = !!(currentQuestion.term && currentQuestion.definition);

  // Vocabulary direction: 'en-vi' (Tiếng Anh -> Tiếng Việt) or 'vi-en' (Tiếng Việt -> Tiếng Anh)
  const [vocabDirection, setVocabDirection] = useState<'en-vi' | 'vi-en'>(() => {
    if (initialProgress.vocabDirection) return initialProgress.vocabDirection;
    if (initialProgress.config.vocabDirection) return initialProgress.config.vocabDirection;
    const saved = localStorage.getItem('quiz_vocab_direction');
    return (saved === 'vi-en' || saved === 'en-vi') ? saved : 'en-vi';
  });

  const toggleVocabDirection = () => {
    const next = vocabDirection === 'en-vi' ? 'vi-en' : 'en-vi';
    setVocabDirection(next);
    localStorage.setItem('quiz_vocab_direction', next);
    setProgress(prev => {
      let newAnswers = { ...prev.answers };
      const currentAns = prev.answers[currentQuestion.id];
      if (currentAns) {
        if (vocabDirection === 'en-vi' && currentAns === currentQuestion.correctAnswerId && currentQuestion.correctEnAnswerId) {
          newAnswers[currentQuestion.id] = currentQuestion.correctEnAnswerId;
        } else if (vocabDirection === 'vi-en' && currentAns === currentQuestion.correctEnAnswerId && currentQuestion.correctAnswerId) {
          newAnswers[currentQuestion.id] = currentQuestion.correctAnswerId;
        } else {
          const targetList = next === 'vi-en' ? currentQuestion.enAnswers : currentQuestion.answers;
          if (!targetList?.some(a => a.id === currentAns)) {
            delete newAnswers[currentQuestion.id];
          }
        }
      }
      return {
        ...prev,
        vocabDirection: next,
        config: { ...prev.config, vocabDirection: next },
        answers: newAnswers
      };
    });
  };

  // Determine active choices and correct answer based on current direction
  const isViToEn = isEnglishVocab && vocabDirection === 'vi-en';
  const activeAnswers = (isViToEn && currentQuestion.enAnswers && currentQuestion.enAnswers.length > 0)
    ? currentQuestion.enAnswers
    : currentQuestion.answers;
  const activeCorrectId = isViToEn
    ? (currentQuestion.correctEnAnswerId || currentQuestion.correctAnswerId)
    : currentQuestion.correctAnswerId;

  // Keep live refs for synchronous flush on exit or unmount
  const progressRef = useRef(progress);
  const timeLeftRef = useRef(timeLeft);
  const currentQIndexRef = useRef(currentQIndex);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    currentQIndexRef.current = currentQIndex;
  }, [currentQIndex]);

  // Synchronous auto save whenever progress updates (answers, marks, question index)
  useEffect(() => {
    const toSave: ProgressData = {
      ...progress,
      timeLeftSeconds: timeLeftRef.current
    };
    api.saveProgressSync(toSave);
  }, [progress]);

  // Save on window unload / unmount
  useEffect(() => {
    const flushSave = () => {
      if (progressRef.current) {
        api.saveProgressSync({
          ...progressRef.current,
          timeLeftSeconds: timeLeftRef.current,
          currentQuestionIndex: currentQIndexRef.current
        });
      }
    };

    window.addEventListener('beforeunload', flushSave);
    window.addEventListener('pagehide', flushSave);

    return () => {
      flushSave();
      window.removeEventListener('beforeunload', flushSave);
      window.removeEventListener('pagehide', flushSave);
    };
  }, []);

  const handleExit = () => {
    if (progressRef.current) {
      api.saveProgressSync({
        ...progressRef.current,
        timeLeftSeconds: timeLeftRef.current,
        currentQuestionIndex: currentQIndexRef.current
      });
    }
    navigate('dashboard');
  };

  useEffect(() => {
    setShowHint(false);
  }, [currentQIndex]);

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

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setProgress(prev => {
      let newQuestions = [...prev.questions];
      
      if (prev.config.randomizeQuestions) {
        newQuestions = shuffleQuestions(newQuestions);
      }
      
      if (prev.config.randomizeAnswers) {
        newQuestions = newQuestions.map(q => ({
          ...q,
          answers: shuffleAnswers([...q.answers]),
          enAnswers: q.enAnswers ? shuffleAnswers([...q.enAnswers]) : q.enAnswers
        }));
      }

      return {
        ...prev,
        questions: newQuestions,
        answers: {},
        currentQuestionIndex: 0,
        markedQuestions: []
      };
    });
    setTimeLeft(
      progress.config.timeLimitMinutes ? progress.config.timeLimitMinutes * 60 : null
    );
    setShowRestartConfirm(false);
  };

  const handleClearAnswer = () => {
    if (!progress.answers[currentQuestion.id]) return;
    setProgress(prev => {
      const newAnswers = { ...prev.answers };
      delete newAnswers[currentQuestion.id];
      return { ...prev, answers: newAnswers };
    });
  };

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
    const hasAnswered = !!progress.answers[currentQuestion.id];
    const canSelect = !hasAnswered || progress.config.mode === 'exam';
    if (!canSelect) return;

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
        case '1': if(activeAnswers[0]) handleSelectAnswer(activeAnswers[0].id); break;
        case '2': if(activeAnswers[1]) handleSelectAnswer(activeAnswers[1].id); break;
        case '3': if(activeAnswers[2]) handleSelectAnswer(activeAnswers[2].id); break;
        case '4': if(activeAnswers[3]) handleSelectAnswer(activeAnswers[3].id); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQIndex, currentQuestion, activeAnswers]);

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
          <div className="quiz-header-group" style={{ position: 'relative' }}>
            <button className="btn btn-neutral" style={{ padding: '0.5rem 1rem' }} onClick={handleExit} title="Lưu bài và quay lại">
              <ArrowLeft /> Thoát bài
            </button>
            <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={handleRestart}>
              <RefreshCw /> Làm lại
            </button>
            {currentQuestion.hint && (
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowHint(!showHint)}>
                <Lightbulb /> Gợi ý
              </button>
            )}
            {progress.answers[currentQuestion.id] && (
              <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={handleClearAnswer} title="Làm lại câu này">
                <RotateCcw /> Làm lại câu
              </button>
            )}
            {isEnglishVocab && (
              <button 
                type="button"
                className="btn btn-outline" 
                style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }} 
                onClick={toggleVocabDirection}
                title="Đổi hướng câu hỏi: Anh - Việt ⇄ Việt - Anh"
              >
                <ArrowLeftRight size={16} color="var(--primary-color)" />
                <span>{vocabDirection === 'en-vi' ? 'Hỏi: Anh ➔ Đáp: Việt' : 'Hỏi: Việt ➔ Đáp: Anh'}</span>
              </button>
            )}
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
          {isEnglishVocab ? (
            /* ─── Quizlet-style vocab layout ─── */
            <div className="quizlet-card-container">
              {/* Prompt label & Swap button */}
              <div className="quizlet-prompt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="quizlet-label">
                  {vocabDirection === 'en-vi' ? 'Thuật ngữ Tiếng Anh' : 'Định nghĩa Tiếng Việt'}
                </span>
                <button
                  type="button"
                  className="btn btn-neutral quizlet-swap-direction-btn"
                  onClick={toggleVocabDirection}
                  title="Đảo chiều câu hỏi: Anh - Việt ⇄ Việt - Anh"
                >
                  <ArrowLeftRight size={14} color="var(--primary-color)" />
                  <span>Đảo: {vocabDirection === 'en-vi' ? 'Anh → Việt' : 'Việt → Anh'}</span>
                </button>
              </div>

              {/* Centre box: English Term + IPA or Vietnamese Definition */}
              <div className="quizlet-center-box">
                {vocabDirection === 'en-vi' ? (
                  /* Question: English Word + IPA */
                  <div className="quizlet-term-text">
                    {currentQuestion.term}
                    {currentQuestion.ipa && (
                      <span className="quizlet-ipa-text"> {currentQuestion.ipa}</span>
                    )}
                  </div>
                ) : (
                  /* Question: Vietnamese Definition */
                  <div>
                    <div className="quizlet-term-text">
                      {currentQuestion.definition}
                    </div>
                    {progress.config.mode === 'practice' && progress.answers[currentQuestion.id] && currentQuestion.ipa && (
                      <div style={{ marginTop: '0.65rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        Phiên âm: <span className="quizlet-ipa-text" style={{ fontSize: '1.05rem' }}>{currentQuestion.ipa}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Answer label */}
              <div className="quizlet-section-label">
                {vocabDirection === 'en-vi' ? 'Chọn định nghĩa tiếng Việt đúng' : 'Chọn từ tiếng Anh đúng'}
              </div>

              {/* 2-column answer grid */}
              <div className="quizlet-answers-grid">
                {activeAnswers.map((ans, idx) => {
                  const hasAnswered = !!progress.answers[currentQuestion.id];
                  const isSelected = progress.answers[currentQuestion.id] === ans.id;
                  const isActuallyCorrect = ans.id === activeCorrectId;
                  const canSelect = !hasAnswered || progress.config.mode === 'exam';

                  let cardClass = 'quizlet-answer-card';
                  if (isSelected) cardClass += ' selected';
                  if (progress.config.mode === 'practice' && hasAnswered) {
                    if (isActuallyCorrect && isSelected) {
                      cardClass = 'quizlet-answer-card correct';
                    } else if (isSelected && !isActuallyCorrect) {
                      cardClass = 'quizlet-answer-card wrong';
                    } else if (!isSelected && isActuallyCorrect) {
                      cardClass = 'quizlet-answer-card correct-hint';
                    } else {
                      cardClass = 'quizlet-answer-card dimmed';
                    }
                  }

                  return (
                    <div
                      key={ans.id}
                      className={cardClass}
                      style={{ cursor: canSelect ? 'pointer' : 'default' }}
                      onClick={() => canSelect && handleSelectAnswer(ans.id)}
                    >
                      <div className="quizlet-num-badge">
                        {progress.config.mode === 'practice' && hasAnswered && isActuallyCorrect ? (
                          <Check size={18} strokeWidth={3} />
                        ) : progress.config.mode === 'practice' && hasAnswered && isSelected ? (
                          <X size={18} strokeWidth={3} />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="quizlet-answer-text">{ans.text}</div>
                      {progress.config.mode === 'practice' && hasAnswered && (
                        <div className="quizlet-status-badge-container">
                          {isActuallyCorrect && isSelected && (
                            <span className="quizlet-status-badge quizlet-tag-correct">
                              <Check size={15} strokeWidth={2.5} /> Đúng
                            </span>
                          )}
                          {isSelected && !isActuallyCorrect && (
                            <span className="quizlet-status-badge quizlet-tag-wrong">
                              <X size={15} strokeWidth={2.5} /> Sai
                            </span>
                          )}
                          {!isSelected && isActuallyCorrect && (
                            <span className="quizlet-status-badge quizlet-tag-hint">
                              <Check size={15} strokeWidth={2.5} /> Đáp án đúng
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── Standard CNTT layout ─── */
            <>
              {showHint && currentQuestion.hint && (
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid var(--primary-color)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>💡 Gợi ý</h4>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-primary)' }} onClick={() => setShowHint(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    {currentQuestion.hint}
                  </div>
                </div>
              )}
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

                    const canSelect = !hasAnswered || progress.config.mode === 'exam';

                    return (
                      <div
                        key={ans.id}
                        onClick={() => canSelect && handleSelectAnswer(ans.id)}
                        style={{
                          padding: '1rem',
                          border: `2px solid ${borderColor}`,
                          borderRadius: '0.5rem',
                          cursor: canSelect ? 'pointer' : 'default',
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
                              <div style={{ fontWeight: 'bold', color: 'var(--correct-color)' }}>✓ Đúng</div>
                            )}
                            {isSelected && !isActuallyCorrect && (
                              <div style={{ fontWeight: 'bold', color: 'var(--wrong-color)' }}>✗ Sai</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
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

              const isCorrect = progress.answers[q.id] === q.correctAnswerId ||
                (!!q.correctEnAnswerId && progress.answers[q.id] === q.correctEnAnswerId);

              let bg = 'var(--surface-color)';
              let border = 'var(--border-color)';
              let color = 'var(--text-primary)';

              if (isAnswered) {
                if (progress.config.mode === 'practice') {
                  bg = isCorrect ? 'var(--correct-bg)' : 'var(--wrong-bg)';
                  border = isCorrect ? 'var(--correct-color)' : 'var(--wrong-color)';
                } else {
                  bg = 'var(--primary-light)';
                  border = 'var(--primary-color)';
                }
              }
              
              if (isCurrent) {
                if (progress.config.mode === 'practice' && isAnswered) {
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

      {/* Restart Confirm Modal */}
      {showRestartConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '450px', textAlign: 'center' }}>
            <RefreshCw style={{ width: '48px', height: '48px', color: 'var(--primary-color)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '1rem' }}>Xác nhận làm lại</h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Bạn có chắc chắn muốn làm lại từ đầu? Toàn bộ kết quả hiện tại sẽ bị xóa.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-neutral" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={() => setShowRestartConfirm(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={confirmRestart}>
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
