import React, { useState, useEffect, useRef } from 'react';

const Topbar = ({ currentView, searchQuery, onSearchChange, onAddExpense, onAddIncome }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const inputRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const getTitle = () => {
    if (currentView === 'overall-dashboard') return 'Overall Dashboard';
    if (currentView === 'dashboard') return 'Expense Dashboard';
    if (currentView === 'income-dashboard') return 'Income Dashboard';
    if (currentView === 'all-expenses') return 'All Expenses';
    return 'Overall Dashboard';
  };

  return (
    <div className="topbar">
      <span className="page-title">{getTitle()}</span>
      <div className="search">
        <i className="ti ti-search" style={{ color: 'var(--text3)', fontSize: '14px' }}></i>
        <input 
          ref={inputRef}
          value={searchQuery || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={
            currentView === 'overall-dashboard' 
              ? "Search transactions..." 
              : currentView === 'income-dashboard' 
                ? "Search incomes..." 
                : "Search expenses..."
          } 
        />
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>/</span>
      </div>
      <button 
        className="icon-btn" 
        onClick={toggleTheme} 
        title="Toggle theme" 
        style={{ marginLeft: 'auto', width: '32px', height: '32px', border: '1px solid var(--border)', background: 'var(--bg2)' }}
      >
        <i className={theme === 'dark' ? 'ti ti-sun' : 'ti ti-moon'} style={{ fontSize: '18px' }}></i>
      </button>
      <button className="btn" onClick={onAddIncome} style={{ color: 'var(--blue)', borderColor: 'rgba(88, 166, 255, 0.3)' }}>
        <i className="ti ti-plus"></i> Add income ↙
      </button>
      <button className="btn btn-primary" onClick={onAddExpense}>
        <i className="ti ti-plus"></i> Add expense ↗
      </button>
    </div>
  );
};

export default Topbar;
