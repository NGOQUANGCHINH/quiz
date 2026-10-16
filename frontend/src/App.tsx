import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import ImportQuiz from './pages/ImportQuiz';
import QuizSetup from './pages/QuizSetup';
import QuizTaking from './pages/QuizTaking';
import QuizResult from './pages/QuizResult';
import QuizReview from './pages/QuizReview';
import type {  ProgressData  } from './types';
import { Menu, Moon, Sun, RotateCcw } from 'lucide-react';

import SidebarNav from './components/SidebarNav';

function App() {
  const [currentPage, setCurrentPage] = useState<string>(() => sessionStorage.getItem('quiz-current-page') || 'dashboard');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(() => sessionStorage.getItem('quiz-selected-id'));
  const [progressData, setProgressData] = useState<ProgressData | null>(() => {
    const saved = sessionStorage.getItem('quiz-progress-data');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<'materials' | 'english'>(() => {
    const saved = localStorage.getItem('study_tab_mode');
    return (saved === 'english' || saved === 'materials') ? saved : 'materials';
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_expanded', String(next));
      return next;
    });
  };

  const handleTabChange = (tab: 'materials' | 'english') => {
    setActiveTab(tab);
    localStorage.setItem('study_tab_mode', tab);
    if (currentPage !== 'dashboard') {
      navigate('dashboard');
    }
  };

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

  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('quiz_progress');
      if (!raw) return false;
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.some((p: any) => p && p.answers && Object.keys(p.answers).length > 0);
    } catch {
      return false;
    }
  });

  const checkSavedProgress = () => {
    try {
      const raw = localStorage.getItem('quiz_progress');
      if (!raw) {
        setHasSavedProgress(false);
        return;
      }
      const list = JSON.parse(raw);
      const has = Array.isArray(list) && list.some((p: any) => p && p.answers && Object.keys(p.answers).length > 0);
      setHasSavedProgress(has);
    } catch {
      setHasSavedProgress(false);
    }
  };

  useEffect(() => {
    checkSavedProgress();
    window.addEventListener('progress-updated', checkSavedProgress);
    window.addEventListener('storage', checkSavedProgress);
    return () => {
      window.removeEventListener('progress-updated', checkSavedProgress);
      window.removeEventListener('storage', checkSavedProgress);
    };
  }, [currentPage]);

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
    } else if (page !== 'taking' && page !== 'result' && page !== 'review') {
      setProgressData(null);
      sessionStorage.removeItem('quiz-progress-data');
    }

    setCurrentPage(page);
    sessionStorage.setItem('quiz-current-page', page);
  };

  return (
    <div className={`app ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${currentPage === 'setup' ? 'app-setup-page' : ''}`}>
      {/* Thân ứng dụng chứa Sidebar Mega Nav chiếm 100vh và nội dung chính */}
      <div className="app-layout">
        <SidebarNav 
          isExpanded={isSidebarExpanded} 
          onToggleExpand={toggleSidebar}
          currentPage={currentPage}
          activeTab={activeTab}
          hasProgress={hasSavedProgress}
          onNavigate={navigate}
          onTabChange={handleTabChange}
          currentTheme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Mobile Top Header (only visible on mobile <= 768px) */}
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="mobile-hamburger-btn"
              onClick={toggleSidebar}
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} />
            </button>
            <span 
              className="mobile-header-logo" 
              onClick={() => { if (currentPage !== 'dashboard') navigate('dashboard'); }}
            >
              Quiz Local
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="mobile-theme-btn"
              onClick={toggleTheme}
              aria-label="Đổi giao diện sáng tối"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <main className={`container ${currentPage === 'setup' ? 'container-setup-100vh' : ''}`}>
          {currentPage === 'dashboard' && <Dashboard navigate={navigate} activeTab={activeTab} onTabChange={handleTabChange} />}
          {currentPage === 'import' && <ImportQuiz navigate={navigate} />}
          {currentPage === 'setup' && selectedQuizId && <QuizSetup quizId={selectedQuizId} navigate={navigate} />}
          {currentPage === 'taking' && progressData && <QuizTaking progress={progressData} navigate={navigate} />}
          {currentPage === 'result' && progressData && <QuizResult progress={progressData} navigate={navigate} />}
          {currentPage === 'review' && progressData && <QuizReview progress={progressData} navigate={navigate} />}
        </main>
      </div>
    </div>
  );
}

export default App;
