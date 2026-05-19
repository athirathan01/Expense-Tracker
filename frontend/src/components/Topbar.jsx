import React, { useState } from 'react';

const Topbar = ({ currentView, onAddExpense, onAddIncome }) => {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getTitle = () => {
    if (currentView === 'dashboard') return 'Dashboard';
    if (currentView === 'income-dashboard') return 'Income Dashboard';
    if (currentView === 'all-expenses') return 'All Expenses';
    return 'Dashboard';
  };

  return (
    <div className="topbar">
      <span className="page-title">{getTitle()}</span>
      <div className="search">
        <i className="ti ti-search" style={{ color: 'var(--text3)', fontSize: '14px' }}></i>
        <input placeholder="Search expenses..." />
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
