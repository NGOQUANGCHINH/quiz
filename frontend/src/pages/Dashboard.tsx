import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { QuizSummary, ProgressData } from '../types';
import { Play, RotateCcw, Plus, Trash2, BookOpen, EyeOff, FolderPlus, Info, X, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  navigate: (page: string, params?: any) => void;
  activeTab?: 'materials' | 'english';
  onTabChange?: (tab: 'materials' | 'english') => void;
}

const defaultEnglishTopics: QuizSummary[] = [
  {
    id: 'english-toeic-vocab',
    title: '3000 Từ vựng TOEIC Thông dụng & Cốt lõi',
    description: 'Từ vựng theo chủ đề kinh doanh, công sở kèm phiên âm IPA & câu ví dụ minh họa.',
    questionCount: 0,
    category: 'english',
  },
  {
    id: 'english-grammar-essential',
    title: 'Ngữ pháp Tiếng Anh Trọng tâm & Bảng thì',
    description: 'Tổng hợp 12 thì cơ bản, câu bị động, câu điều kiện, mệnh đề quan hệ & công thức.',
    questionCount: 0,
    category: 'english',
  },
  {
    id: 'english-reading-comprehension',
    title: 'Luyện đọc hiểu Comprehension (Passages)',
    description: 'Bài đọc ngắn - trung bình kèm các câu hỏi tìm ý chính và suy luận ngữ cảnh.',
    questionCount: 0,
    category: 'english',
  },
  {
    id: 'english-phrasal-verbs',
    title: 'Cụm động từ & Idioms thường gặp (Phrasal Verbs)',
    description: 'Các cụm từ hay xuất hiện trong giao tiếp và đề thi kèm mẹo nhớ nhanh.',
    questionCount: 0,
    category: 'english',
  }
];

export default function Dashboard({ navigate, activeTab: propActiveTab }: Props) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [progressList, setProgressList] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicInfo, setSelectedTopicInfo] = useState<QuizSummary | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [internalTab] = useState<'materials' | 'english'>(() => {
    const saved = localStorage.getItem('study_tab_mode');
    return (saved === 'english' || saved === 'materials') ? saved : 'materials';
  });

  const activeTab = propActiveTab || internalTab;

  const loadData = async () => {
    try {
      const qList = await api.getQuizzes();
      setQuizzes(qList);
      const pList = await api.getProgressList();
      setProgressList(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleProgressUpdate = () => {
      loadData();
    };
    window.addEventListener('progress-updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('progress-updated', handleProgressUpdate);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTopicInfo(null);
        setDeleteConfirmId(null);
      }
    };
    if (selectedTopicInfo || deleteConfirmId) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTopicInfo, deleteConfirmId]);

  const resumeProgress = (progress: ProgressData) => {
    navigate('taking', { progress });
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await api.deleteProgress(deleteConfirmId);
      setDeleteConfirmId(null);
      loadData();
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  // Filter quizzes according to active tab
  const materialQuizzes = quizzes.filter(q => q.category !== 'english');
  const englishQuizzesFromApi = quizzes.filter(q => q.category === 'english');
  const englishDisplayList = [
    ...englishQuizzesFromApi,
    ...defaultEnglishTopics.filter(dt => !englishQuizzesFromApi.some(eq => eq.id === dt.id))
  ];

  // Helper to determine if a quiz belongs to English tab
  const isEnglishQuiz = (quizId: string, title?: string): boolean => {
    if (quizId.startsWith('english-')) return true;
    const found = quizzes.find(q => q.id === quizId);
    if (found && found.category === 'english') return true;
    if (defaultEnglishTopics.some(t => t.id === quizId)) return true;
    const lowerTitle = (title || '').toLowerCase();
    return lowerTitle.includes('tiếng anh') || 
           lowerTitle.includes('english') || 
           lowerTitle.includes('toeic') || 
           lowerTitle.includes('ielts');
  };

  // Filter all valid in-progress quizzes
  const allActiveProgress = progressList.filter(p => p && p.answers && Object.keys(p.answers).length > 0);

  // Hiển thị riêng bài đang làm cho từng tab: tab nào chỉ hiển thị bài đang làm của tab đó
  const tabActiveProgress = allActiveProgress.filter(p => {
    const isEng = isEnglishQuiz(p.quizId, p.title);
    return activeTab === 'english' ? isEng : !isEng;
  });

  return (
    <div>
      {/* Dashboard Top Header Bar */}
      <div className="dashboard-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="dashboard-title" style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {activeTab === 'materials' ? 'Danh sách bộ đề Quiz' : 'Tài liệu học Tiếng Anh'}
          </h2>
        </div>

        <button className="btn btn-primary dashboard-add-btn" style={{ minWidth: '155px' }} onClick={() => navigate('import')}>
          <Plus /> {activeTab === 'materials' ? 'Thêm bộ đề' : 'Thêm tài liệu'}
        </button>
      </div>

      {/* Hiển thị bài đang làm riêng cho từng tab (không để chung) */}
      {tabActiveProgress.length > 0 && (
        <div id="in-progress-section" style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '2px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
              <RotateCcw size={22} /> Bài đang làm ({tabActiveProgress.length})
            </h3>
          </div>

          <div className="dashboard-cards-grid">
            {tabActiveProgress.map(p => {
              const isEnglish = isEnglishQuiz(p.quizId, p.title);
              const answeredCount = Object.keys(p.answers || {}).length;
              const totalCount = p.questions?.length || 0;
              const percent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
              return (
                <div key={p.id} className="card dashboard-quiz-card" style={{ border: '2px solid var(--border-color)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <span className={`badge-pill ${isEnglish ? 'badge-english' : 'badge-code'}`}>
                      {isEnglish ? 'Tiếng Anh' : 'Quiz Lập trình'}
                    </span>
                    <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                      {new Date(p.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 style={{ marginBottom: '0.75rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>{p.title}</h3>

                  {/* Progress bar info */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      <span>Đã làm: <strong>{answeredCount}</strong> / {totalCount} câu</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{percent}%</span>
                    </div>
                    <div style={{ height: '7px', background: 'var(--neutral-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={() => resumeProgress(p)}>
                      <Play size={16} /> Tiếp tục làm
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }} onClick={() => setDeleteConfirmId(p.id)} title="Xóa bài dở này">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Khung nội dung chính với hiệu ứng mượt mà và triệt tiêu giật layout */}
      <div key={activeTab} className="tab-pane">
        <div className="dashboard-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem' }}>
              {activeTab === 'materials' ? 'Tất cả bộ đề ôn tập' : 'Danh mục chủ đề ôn luyện'}
            </h3>
          </div>
        </div>

        {activeTab === 'materials' ? (
          materialQuizzes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Chưa có bộ đề nào. Hãy thêm bộ đề mới!</p>
            </div>
          ) : (
            <div className="dashboard-cards-grid">
              {materialQuizzes.map(quiz => (
                <div key={quiz.id} className="card dashboard-quiz-card">
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{quiz.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{quiz.questionCount} câu hỏi</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('setup', { quizId: quiz.id })}>
                      <Play /> Bắt đầu làm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="dashboard-cards-grid">
            {englishDisplayList.map(topic => (
              <div key={topic.id} className="card dashboard-quiz-card">
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{topic.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {topic.questionCount || 0} câu hỏi
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  {topic.questionCount && topic.questionCount > 0 ? (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('setup', { quizId: topic.id })}>
                      <Play /> Bắt đầu làm
                    </button>
                  ) : (
                    <button 
                      className="btn btn-neutral" 
                      style={{ flex: 1, color: 'var(--text-secondary)' }}
                      onClick={() => setSelectedTopicInfo(topic)}
                    >
                      <FolderPlus size={16} /> Sẵn sàng nạp dữ liệu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Popover thông tin chủ đề tiếng Anh */}
      {selectedTopicInfo && (
        <div className="modal-overlay" onClick={() => setSelectedTopicInfo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Thông tin chủ đề</h3>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedTopicInfo(null)}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  {selectedTopicInfo.title}
                </h4>
                <span className="badge-pill badge-english">Tiếng Anh</span>
              </div>

              {selectedTopicInfo.description && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {selectedTopicInfo.description}
                </p>
              )}

              <div style={{
                backgroundColor: 'var(--neutral-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                padding: '1.2rem',
                marginBottom: '0.5rem'
              }}>
                <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <Info size={16} color="#6366f1" /> Khung tài liệu đang chờ nạp câu hỏi
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  Chủ đề này hiện chưa có câu hỏi. Khi bạn về nhà mở máy tính, bạn chỉ cần:
                </p>
                <ol style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.7 }}>
                  <li>Tạo file dữ liệu <code>.json</code> trong thư mục <code>frontend/public/data/</code></li>
                  <li>Điền danh sách câu hỏi hoặc từ vựng vào file</li>
                  <li>Gõ <code>git push</code> lên GitHub là bạn có thể mở điện thoại học ngay ở bất cứ đâu!</li>
                </ol>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => setSelectedTopicInfo(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa bài làm dở */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Xác nhận xóa bài</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeleteConfirmId(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa bài thi đang làm dở này? Dữ liệu tiến trình sẽ bị xóa khỏi trình duyệt.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-neutral" onClick={() => setDeleteConfirmId(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={confirmDelete}>
                Xóa bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
