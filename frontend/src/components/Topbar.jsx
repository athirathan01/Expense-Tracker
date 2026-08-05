import React, { useState, useEffect, useRef } from 'react';

const Topbar = ({ 
  currentView, 
  searchQuery, 
  onSearchChange, 
  timeFilter, 
  setTimeFilter, 
  availableYears = [], 
  isRefreshing = false,
  onRefreshNow,
  lastSyncedTime,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  onAddExpense, 
  onAddIncome, 
  onToggleMobileMenu 
}) => {
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
    if (currentView === 'all-incomes') return 'All Incomes';
    return 'Overall Dashboard';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatLastSynced = () => {
    if (!lastSyncedTime) return '';
    return lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

      {/* Search Box + Dropdown Filter Area */}
      <div className="search-filter-area" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '580px' }}>
        <div className="search" style={{ flex: 1 }}>
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

        {/* Dropdown Filter next to Search box for Overall Dashboard */}
        {currentView === 'overall-dashboard' && timeFilter && (
          <div className="topbar-filter-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select 
              className="topbar-filter-select"
              value={timeFilter.mode}
              onChange={(e) => setTimeFilter(prev => ({ ...prev, mode: e.target.value }))}
              title="Time Period Filter"
            >
              <option value="all">📅 All Time</option>
              <option value="year">📅 Yearly</option>
              <option value="month">📅 Monthly</option>
              <option value="week">📅 Weekly</option>
              <option value="day">📅 Daily</option>
              <option value="custom">📅 Custom Range</option>
            </select>

            {timeFilter.mode === 'year' && (
              <select 
                className="topbar-filter-select"
                value={timeFilter.year}
                onChange={(e) => setTimeFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {timeFilter.mode === 'month' && (
              <>
                <select 
                  className="topbar-filter-select"
                  value={timeFilter.year}
                  onChange={(e) => setTimeFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
                  style={{ width: '70px' }}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select 
                  className="topbar-filter-select"
                  value={timeFilter.month}
                  onChange={(e) => setTimeFilter(prev => ({ ...prev, month: Number(e.target.value) }))}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </>
            )}

            {timeFilter.mode === 'day' && (
              <input 
                type="date"
                className="topbar-filter-select"
                value={timeFilter.date}
                onChange={(e) => setTimeFilter(prev => ({ ...prev, date: e.target.value }))}
              />
            )}

            {timeFilter.mode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="date"
                  className="topbar-filter-select"
                  value={timeFilter.customFrom}
                  onChange={(e) => setTimeFilter(prev => ({ ...prev, customFrom: e.target.value }))}
                  title="From Date"
                />
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>-</span>
                <input 
                  type="date"
                  className="topbar-filter-select"
                  value={timeFilter.customTo}
                  onChange={(e) => setTimeFilter(prev => ({ ...prev, customTo: e.target.value }))}
                  title="To Date"
                />
              </div>
            )}
          </div>
        )}
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
