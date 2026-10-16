import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { Quiz, QuizConfig, ProgressData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  Trophy, 
  Clock, 
  Layers, 
  Shuffle, 
  RotateCcw, 
  Zap, 
  Play, 
  Sparkles, 
  SlidersHorizontal,
  Infinity as InfinityIcon
} from 'lucide-react';
import { shuffleQuestions, shuffleAnswers } from '../utils/shuffle';

interface Props {
  quizId: string;
  navigate: (page: string, params?: any) => void;
}

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

  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const [isCustomQuestions, setIsCustomQuestions] = useState(false);
  const [customTimeLimit, setCustomTimeLimit] = useState<string>('');
  const [isCustomTime, setIsCustomTime] = useState(false);
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

  if (!quiz) return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
      <div className="spinner" style={{ margin: '0 auto 1rem' }} />
      Đang tải thông tin đề thi...
    </div>
  );

  const totalQuestions = quiz.questions.length;

  // Generate sensible question preset options
  const questionPresets = [20, 30, 50, 100].filter(count => count < totalQuestions);
  if (questionPresets.length === 0 && totalQuestions > 5) {
    if (totalQuestions > 10) questionPresets.push(10);
    if (totalQuestions > 15) questionPresets.push(15);
  }

  // Time preset options
  const timePresets = [
    { label: 'Không giới hạn', value: null, icon: <InfinityIcon size={16} /> },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
    { label: '90 phút', value: 90 }
  ];

  return (
    <div className="quiz-setup-wrapper">
      <div className="quiz-setup-card">
        {/* Title Header with integrated Back button */}
        <div className="setup-title-section">
          <div className="setup-title-content">
            <h2 className="setup-quiz-title">
              Cấu hình bài thi: <span>{quiz.title}</span>
            </h2>
            <div className="setup-header-badge">
              <Layers size={14} color="var(--primary-color)" />
              <span>Tổng cộng <strong>{totalQuestions}</strong> câu hỏi trắc nghiệm</span>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-neutral setup-back-btn" 
            onClick={() => navigate('dashboard')}
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </button>
        </div>

        {/* Scrollable / Flexible content area */}
        <div className="setup-card-content">
          {/* 1. CHỌN CHẾ ĐỘ LÀM BÀI (MODE CARDS) */}
          <div className="setup-section-block">
            <div className="setup-section-label">
              <SlidersHorizontal size={15} color="var(--primary-color)" />
              <span>1. Chọn chế độ làm bài</span>
            </div>

          <div className="setup-mode-grid">
            {/* Card: Ôn tập */}
            <div 
              className={`setup-mode-card ${config.mode === 'practice' ? 'active' : ''}`}
              onClick={() => setConfig({ ...config, mode: 'practice' })}
            >
              <div className="mode-card-left">
                <div 
                  className="mode-icon-box"
                  style={{ 
                    backgroundColor: config.mode === 'practice' ? 'var(--primary-color)' : 'var(--neutral-bg)',
                    color: config.mode === 'practice' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <BookOpen size={24} />
                </div>
              </div>

              <div className="mode-card-body">
                <div className="mode-card-title-row">
                  <span className="mode-card-title">Chế độ Ôn tập</span>
                  <span 
                    className="mode-badge"
                    style={{ 
                      backgroundColor: config.mode === 'practice' ? 'rgba(239, 68, 68, 0.15)' : 'var(--neutral-bg)',
                      color: config.mode === 'practice' ? 'var(--primary-color)' : 'var(--text-secondary)'
                    }}
                  >
                    <Sparkles size={12} /> Khuyên dùng để học
                  </span>
                </div>
                <p className="mode-card-desc">
                  Hiện đáp án đúng và lời giải thích chi tiết ngay sau mỗi câu chọn. Có nút gợi ý khi gặp câu hỏi khó.
                </p>
              </div>

              <div className="mode-card-right">
                <div className="mode-radio-indicator">
                  {config.mode === 'practice' && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>
            </div>

            {/* Card: Thi thử */}
            <div 
              className={`setup-mode-card ${config.mode === 'exam' ? 'active' : ''}`}
              onClick={() => setConfig({ ...config, mode: 'exam' })}
            >
              <div className="mode-card-left">
                <div 
                  className="mode-icon-box"
                  style={{ 
                    backgroundColor: config.mode === 'exam' ? 'var(--primary-color)' : 'var(--neutral-bg)',
                    color: config.mode === 'exam' ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Trophy size={24} />
                </div>
              </div>

              <div className="mode-card-body">
                <div className="mode-card-title-row">
                  <span className="mode-card-title">Chế độ Thi thử</span>
                  <span 
                    className="mode-badge"
                    style={{ 
                      backgroundColor: config.mode === 'exam' ? 'rgba(239, 68, 68, 0.15)' : 'var(--neutral-bg)',
                      color: config.mode === 'exam' ? 'var(--primary-color)' : 'var(--text-secondary)'
                    }}
                  >
                    <Clock size={12} /> Mô phỏng thi thật
                  </span>
                </div>
                <p className="mode-card-desc">
                  Ẩn toàn bộ đáp án trong quá trình làm bài. Tự động tính điểm, xếp loại và xem báo cáo kết quả khi nộp bài.
                </p>
              </div>

              <div className="mode-card-right">
                <div className="mode-radio-indicator">
                  {config.mode === 'exam' && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CẤU HÌNH CHI TIẾT DẠNG HÀNG NGANG (HORIZONTAL ROWS) */}
        <div className="setup-section-block">
          <div className="setup-section-label">
            <SlidersHorizontal size={16} color="var(--primary-color)" />
            <span>2. Tùy chỉnh chi tiết bài thi</span>
          </div>

          <div className="setup-rows-container">
            {/* HÀNG 1: SỐ LƯỢNG CÂU HỎI */}
            <div className="setup-horizontal-row">
              <div className="setup-row-label-col">
                <div className="setup-row-label-title">
                  <Layers size={18} color="var(--primary-color)" />
                  <span>Số lượng câu hỏi</span>
                </div>
                <div className="setup-row-label-sub">Chọn số lượng câu muốn ôn luyện</div>
              </div>

              <div className="setup-row-content-col">
                <div className="setup-pill-group">
                  <button
                    type="button"
                    className={`setup-pill-btn ${config.questionCount === 'all' && !isCustomQuestions ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomQuestions(false);
                      setConfig({ ...config, questionCount: 'all' });
                    }}
                  >
                    <span>Toàn bộ ({totalQuestions} câu)</span>
                  </button>

                  {questionPresets.map(count => (
                    <button
                      key={count}
                      type="button"
                      className={`setup-pill-btn ${config.questionCount === count && !isCustomQuestions ? 'active' : ''}`}
                      onClick={() => {
                        setIsCustomQuestions(false);
                        setConfig({ ...config, questionCount: count });
                      }}
                    >
                      <span>{count} câu</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`setup-pill-btn ${isCustomQuestions ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomQuestions(true);
                      const val = parseInt(customQuestionCount) || 10;
                      setConfig({ ...config, questionCount: Math.min(val, totalQuestions) });
                    }}
                  >
                    <span>Tùy chỉnh...</span>
                  </button>
                </div>

                {isCustomQuestions && (
                  <div className="setup-custom-inline">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nhập số câu:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalQuestions}
                      value={customQuestionCount}
                      placeholder="10"
                      className="setup-custom-input"
                      onChange={e => {
                        const val = e.target.value;
                        setCustomQuestionCount(val);
                        const parsed = parseInt(val);
                        if (!isNaN(parsed) && parsed > 0) {
                          setConfig({ ...config, questionCount: Math.min(parsed, totalQuestions) });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ tối đa {totalQuestions} câu</span>
                  </div>
                )}
              </div>
            </div>

            {/* HÀNG 2: THỜI GIAN LÀM BÀI */}
            <div className="setup-horizontal-row">
              <div className="setup-row-label-col">
                <div className="setup-row-label-title">
                  <Clock size={18} color="var(--primary-color)" />
                  <span>Thời gian làm bài</span>
                </div>
                <div className="setup-row-label-sub">Giới hạn thời gian hoặc tự do làm bài</div>
              </div>

              <div className="setup-row-content-col">
                <div className="setup-pill-group">
                  {timePresets.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`setup-pill-btn ${config.timeLimitMinutes === preset.value && !isCustomTime ? 'active' : ''}`}
                      onClick={() => {
                        setIsCustomTime(false);
                        setConfig({ ...config, timeLimitMinutes: preset.value });
                      }}
                    >
                      {preset.icon}
                      <span>{preset.label}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`setup-pill-btn ${isCustomTime ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomTime(true);
                      const val = parseInt(customTimeLimit) || 20;
                      setConfig({ ...config, timeLimitMinutes: val });
                    }}
                  >
                    <span>Tùy chỉnh...</span>
                  </button>
                </div>

                {isCustomTime && (
                  <div className="setup-custom-inline">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nhập số phút:</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={customTimeLimit}
                      placeholder="20"
                      className="setup-custom-input"
                      onChange={e => {
                        const val = e.target.value;
                        setCustomTimeLimit(val);
                        const parsed = parseInt(val);
                        if (!isNaN(parsed) && parsed > 0) {
                          setConfig({ ...config, timeLimitMinutes: parsed });
                        }
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>phút</span>
                  </div>
                )}
              </div>
            </div>

            {/* HÀNG 3: TÙY CHỌN BỔ SUNG */}
            <div className="setup-horizontal-row">
              <div className="setup-row-label-col">
                <div className="setup-row-label-title">
                  <Sparkles size={18} color="var(--primary-color)" />
                  <span>Tùy chọn bổ sung</span>
                </div>
                <div className="setup-row-label-sub">Đảo câu hỏi, đảo đáp án, chuyển câu</div>
              </div>

              <div className="setup-row-content-col">
                <div className="setup-options-row">
                  {/* Đảo thứ tự câu hỏi */}
                  <div 
                    className={`setup-option-card ${config.randomizeQuestions ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, randomizeQuestions: !config.randomizeQuestions })}
                  >
                    <div className="setup-option-checkbox">
                      {config.randomizeQuestions && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shuffle size={17} color={config.randomizeQuestions ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                      <span className="option-title">Đảo câu hỏi</span>
                    </div>
                  </div>

                  {/* Đảo thứ tự đáp án */}
                  <div 
                    className={`setup-option-card ${config.randomizeAnswers ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, randomizeAnswers: !config.randomizeAnswers })}
                  >
                    <div className="setup-option-checkbox">
                      {config.randomizeAnswers && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RotateCcw size={17} color={config.randomizeAnswers ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                      <span className="option-title">Đảo đáp án</span>
                    </div>
                  </div>

                  {/* Tự động chuyển câu */}
                  <div 
                    className={`setup-option-card ${config.autoNextQuestion ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, autoNextQuestion: !config.autoNextQuestion })}
                  >
                    <div className="setup-option-checkbox">
                      {config.autoNextQuestion && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={17} color={config.autoNextQuestion ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                      <span className="option-title">Tự chuyển câu (1s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* 3. TỔNG KẾT VÀ NÚT BẮT ĐẦU */}
        <div className="setup-footer-bar">
          <div className="setup-summary-info">
            <span className="summary-label">Tóm tắt:</span>
            <div className="summary-tags-group">
              <div className="summary-tag">
                {config.mode === 'practice' ? <BookOpen size={14} color="var(--primary-color)" /> : <Trophy size={14} color="var(--primary-color)" />}
                <span>{config.mode === 'practice' ? 'Ôn tập tức thì' : 'Thi thử tính giờ'}</span>
              </div>
              <div className="summary-tag">
                <Layers size={14} color="var(--primary-color)" />
                <span>{config.questionCount === 'all' ? `Toàn bộ (${totalQuestions} câu)` : `${config.questionCount} câu hỏi`}</span>
              </div>
              <div className="summary-tag">
                <Clock size={14} color="var(--primary-color)" />
                <span>{config.timeLimitMinutes ? `${config.timeLimitMinutes} phút` : 'Không giới hạn thời gian'}</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="setup-start-btn" 
            onClick={handleStart}
          >
            <Play size={20} fill="white" />
            <span>Bắt đầu làm bài thi ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
