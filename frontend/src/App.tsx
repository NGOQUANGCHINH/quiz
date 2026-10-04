import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ImportQuiz from './pages/ImportQuiz';
import QuizSetup from './pages/QuizSetup';
import QuizTaking from './pages/QuizTaking';
import QuizResult from './pages/QuizResult';
import QuizReview from './pages/QuizReview';
import type {  ProgressData  } from './types';

import { Moon, Sun, RefreshCw } from 'lucide-react';
function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => sessionStorage.getItem('quiz-current-page') || 'dashboard');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(() => sessionStorage.getItem('quiz-selected-id'));
  const [progressData, setProgressData] = useState<ProgressData | null>(() => {
    const saved = sessionStorage.getItem('quiz-progress-data');
    return saved ? JSON.parse(saved) : null;
  });

  // Handle broken state where page requires progressData but it's null
  useEffect(() => {
    if (['taking', 'result', 'review'].includes(currentPage) && !progressData) {
      setCurrentPage('dashboard');
      sessionStorage.setItem('quiz-current-page', 'dashboard');
    }
  }, [currentPage, progressData]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('quiz-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigate = (page: string, params?: any) => {
    if (params?.quizId) {
      setSelectedQuizId(params.quizId);
      sessionStorage.setItem('quiz-selected-id', params.quizId);
    } else {
      setSelectedQuizId(null);
      sessionStorage.removeItem('quiz-selected-id');
    }

    if (params?.progress) {
      setProgressData(params.progress);
      sessionStorage.setItem('quiz-progress-data', JSON.stringify(params.progress));
    } else if (page !== 'taking') {
      setProgressData(null);
      sessionStorage.removeItem('quiz-progress-data');
    }

    setCurrentPage(page);
    sessionStorage.setItem('quiz-current-page', page);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 style={{ cursor: 'pointer', margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }} onClick={() => navigate('dashboard')}>
          QuizMaster Local
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => window.location.reload()} className="btn btn-neutral" title="Cập nhật tất cả bộ đề">
            <RefreshCw size={18} /> Update
          </button>
          <button onClick={toggleTheme} className="btn btn-neutral">
            {theme === 'light' ? <><Moon size={18} /> Dark Mode</> : <><Sun size={18} /> Light Mode</>}
          </button>
        </div>
      </header>
      
      <main className="container">
        {currentPage === 'dashboard' && <Dashboard navigate={navigate} />}
        {currentPage === 'import' && <ImportQuiz navigate={navigate} />}
        {currentPage === 'setup' && selectedQuizId && <QuizSetup quizId={selectedQuizId} navigate={navigate} />}
        {currentPage === 'taking' && progressData && <QuizTaking progress={progressData} navigate={navigate} />}
        {currentPage === 'result' && progressData && <QuizResult progress={progressData} navigate={navigate} />}
        {currentPage === 'review' && progressData && <QuizReview progress={progressData} navigate={navigate} />}
      </main>
    </div>
  );
}

export default App;
