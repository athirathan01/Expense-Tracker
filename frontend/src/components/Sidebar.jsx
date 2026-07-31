import React from 'react';
import { API_BASE_URL } from '../config/api';

const Sidebar = ({ currentView, onViewChange, expensesCount, categoriesCount, currentUser }) => {
  const getAvatarSrc = () => {
    if (!currentUser?.avatarUrl) return null;
    if (currentUser.avatarUrl.startsWith('http')) return currentUser.avatarUrl;
    return `${API_BASE_URL}${currentUser.avatarUrl.startsWith('/') ? '' : '/'}${currentUser.avatarUrl}`;
  };

  const avatarSrc = getAvatarSrc();

  return (
    <div className="sidebar">
      <div className="logo" onClick={() => onViewChange('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <svg viewBox="0 0 16 16">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2v4l3 1.5-.5 1L7 8V3h1z" />
          </svg>
        </div>
        <span className="logo-name">Xtrak</span>
      </div>
      
      <nav className="nav">
        <div className="nav-section">Overview</div>
        <div 
          className={`nav-item ${currentView === 'overall-dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('overall-dashboard')}
        >
          <i className="ti ti-chart-pie"></i> Overall Dashboard
        </div>
        <div 
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <i className="ti ti-layout-dashboard"></i> Expense Dashboard
        </div>
        <div 
          className={`nav-item ${currentView === 'income-dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('income-dashboard')}
        >
          <i className="ti ti-coin"></i> Income Dashboard
        </div>
        <div className="nav-item">
          <i className="ti ti-report-analytics"></i> Reports
        </div>
        
        <div className="nav-section" style={{ marginTop: '8px' }}>Expenses</div>
        <div 
          className={`nav-item ${currentView === 'all-expenses' ? 'active' : ''}`}
          onClick={() => onViewChange('all-expenses')}
        >
          <i className="ti ti-list"></i> All Expenses <span className="badge">{expensesCount}</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-tags"></i> Categories <span className="badge">{categoriesCount}</span>
        </div>
        <div className="nav-item">
          <i className="ti ti-wallet"></i> Budgets
        </div>
      </nav>
      
      <div className="sidebar-footer" title={currentUser?.email || ''}>
        {avatarSrc ? (
          <img 
            src={avatarSrc} 
            alt={currentUser?.fullName || 'User'} 
            className="avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              if (currentUser?.fallbackAvatar && e.target.src !== currentUser.fallbackAvatar) {
                e.target.src = currentUser.fallbackAvatar;
              } else {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
              }
            }} 
          />
        ) : null}
        <div 
          className="avatar" 
          style={{ display: avatarSrc ? 'none' : 'flex' }}
        >
          {currentUser?.initials || '??'}
        </div>
        <span className="avatar-name">{currentUser?.fullName || 'Guest User'}</span>
      </div>
    </div>
  );
};

export default Sidebar;
