import React, { useState } from 'react';
import { api } from '../utils/api';
import type {  Quiz  } from '../types';
import { UploadCloud, CheckCircle, AlertTriangle, ArrowLeft, FileCheck } from 'lucide-react';

interface Props {
  navigate: (page: string) => void;
}

export default function ImportQuiz({ navigate }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setPreviewQuiz(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const quiz = await api.importQuiz(file);
      setPreviewQuiz(quiz);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân tích file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewQuiz) return;
    setLoading(true);
    try {
      await api.saveQuiz(previewQuiz);
      navigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu bộ đề');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button className="btn btn-neutral" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('dashboard')}>
        <ArrowLeft /> Quay lại
      </button>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Import bộ đề mới</h2>
        
        {!previewQuiz ? (
          <div>
            <div style={{
              border: '2px dashed var(--border-color)',
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'var(--bg-color)'
            }}>
              {file ? (
                <>
                  <FileCheck style={{ width: '48px', height: '48px', color: 'var(--correct-color)', marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--correct-color)' }}>Đã chọn file</h3>
                  <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 600 }}>
                    {file.name} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>({Math.round(file.size / 1024)} KB)</span>
                  </p>
                  <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} />
                  <label htmlFor="file-upload" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    Chọn file khác
                  </label>
                </>
              ) : (
                <>
                  <UploadCloud style={{ width: '48px', height: '48px', color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '0.5rem' }}>Kéo thả file hoặc chọn từ máy</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Hỗ trợ: PDF, TXT, JSON
                  </p>
                  <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} />
                  <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    Chọn file
                  </label>
                </>
              )}
            </div>

            {error && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--wrong-bg)', color: 'var(--wrong-color)', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle /> {error}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={!file || loading} onClick={handleImport}>
              {loading ? 'Đang xử lý...' : 'Phân tích file'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--correct-color)', marginBottom: '1.5rem' }}>
              <CheckCircle size={24} />
              <h3 style={{ margin: 0 }}>Phân tích thành công!</h3>
            </div>

            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>Tên bộ đề:</strong> {previewQuiz.title}</p>
              <p style={{ marginBottom: '0.5rem' }}><strong>Tổng số câu hỏi:</strong> {previewQuiz.questions.length}</p>
              
              {/* Kiểm tra câu lỗi - nếu không có đáp án đúng */}
              {(() => {
                const invalidCount = previewQuiz.questions.filter(q => !q.correctAnswerId || q.answers.length < 2).length;
                return (
                  <div>
                    <p style={{ color: invalidCount > 0 ? 'var(--wrong-color)' : 'var(--correct-color)' }}>
                      <strong>Câu hợp lệ:</strong> {previewQuiz.questions.length - invalidCount}
                    </p>
                    <p style={{ color: invalidCount > 0 ? 'var(--wrong-color)' : 'var(--text-secondary)' }}>
                      <strong>Câu lỗi (thiếu đáp án/thiếu đ/a đúng):</strong> {invalidCount}
                    </p>
                    {invalidCount > 0 && (
                      <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto', fontSize: '0.9rem' }}>
                        {previewQuiz.questions.filter(q => !q.correctAnswerId || q.answers.length < 2).map((q, idx) => (
                          <div key={idx} style={{ color: 'var(--wrong-color)', marginBottom: '0.25rem' }}>
                            - Lỗi ở câu: "{q.question.substring(0, 50)}..."
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-neutral" style={{ flex: 1 }} onClick={() => setPreviewQuiz(null)}>
                Hủy / Chọn file khác
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu bộ đề này'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
