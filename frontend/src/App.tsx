import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ImportQuiz from './pages/ImportQuiz';
import QuizSetup from './pages/QuizSetup';
import QuizTaking from './pages/QuizTaking';
import QuizResult from './pages/QuizResult';
import QuizReview from './pages/QuizReview';
import type {  ProgressData  } from './types';

import { Moon, Sun } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const navigate = (page: string, params?: any) => {
    if (params?.quizId) setSelectedQuizId(params.quizId);
    if (params?.progress) setProgressData(params.progress);
    setCurrentPage(page);
  };

  return (
    <div className="app">
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
        <h1 style={{ cursor: 'pointer', margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }} onClick={() => navigate('dashboard')}>
          QuizMaster Local
        </h1>
        <button onClick={toggleTheme} className="btn btn-neutral">
          {theme === 'light' ? <><Moon /> Dark Mode</> : <><Sun /> Light Mode</>}
        </button>
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
