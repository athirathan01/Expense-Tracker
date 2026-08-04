import React, { useState, useEffect, useRef } from 'react';

const Topbar = ({ currentView, searchQuery, onSearchChange, onAddExpense, onAddIncome, onToggleMobileMenu }) => {
  const [theme, setTheme] = useState('dark');
  const inputRef = useRef(null);

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
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
      <button 
        className="icon-btn mobile-menu-btn" 
        onClick={onToggleMobileMenu} 
        title="Toggle navigation"
        style={{ 
          display: 'none', 
          width: '32px', 
          height: '32px', 
          border: '1px solid var(--border)', 
          background: 'var(--bg2)',
          color: 'var(--text)',
          borderRadius: '6px',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <i className="ti ti-menu-2" style={{ fontSize: '18px' }}></i>
      </button>

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

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <button 
          className="icon-btn" 
          onClick={toggleTheme} 
          title="Toggle theme" 
          style={{ width: '32px', height: '32px', border: '1px solid var(--border)', background: 'var(--bg2)' }}
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
    </div>
  );
};

export default Topbar;
