import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type {  QuizSummary, ProgressData  } from '../types';
import { Play, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface Props {
  navigate: (page: string, params?: any) => void;
}

export default function Dashboard({ navigate }: Props) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [progressList, setProgressList] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const resumeProgress = (progress: ProgressData) => {
    navigate('taking', { progress });
  };

  const deleteProgress = async (id: string) => {
    if (confirm('Xóa bài đang làm dở?')) {
      await api.deleteProgress(id);
      loadData();
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Danh sách bộ đề</h2>
        <button className="btn btn-primary" onClick={() => navigate('import')}>
          <Plus /> Thêm bộ đề
        </button>
      </div>

      {progressList.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Bài đang làm dở</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {progressList.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>{p.title}</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Tiến trình: {Object.keys(p.answers).length} / {p.questions.length} câu
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => resumeProgress(p)}>
                    Tiếp tục
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => deleteProgress(p.id)}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Chưa có bộ đề nào. Hãy thêm bộ đề mới!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {quizzes.map(quiz => (
            <div key={quiz.id} className="card">
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{quiz.title}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{quiz.questionCount} câu hỏi</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('setup', { quizId: quiz.id })}>
                  <Play /> Bắt đầu làm
                </button>
                {/* <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('setup', { quizId: quiz.id, mode: 'practice' })}>
                  <RotateCcw size={18} /> Ôn tập
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
