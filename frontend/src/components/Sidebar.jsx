import React from 'react';
import { API_BASE_URL } from '../config/api';

const Sidebar = ({ currentView, onViewChange, expensesCount, incomesCount, currentUser, isMobileOpen, onCloseMobile }) => {
  const getAvatarSrc = () => {
    if (!currentUser?.avatarUrl) return null;
    if (currentUser.avatarUrl.startsWith('http')) return currentUser.avatarUrl;
    return `${API_BASE_URL}${currentUser.avatarUrl.startsWith('/') ? '' : '/'}${currentUser.avatarUrl}`;
  };

  const avatarSrc = getAvatarSrc();

  const handleNavClick = (view) => {
    onViewChange(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={onCloseMobile}></div>}
      <div className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="logo" onClick={() => handleNavClick('dashboard')} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon">
              <svg viewBox="0 0 16 16">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2v4l3 1.5-.5 1L7 8V3h1z" />
              </svg>
            </div>
            <span className="logo-name">Xtrak</span>
          </div>
          {isMobileOpen && (
            <button 
              onClick={(e) => { e.stopPropagation(); onCloseMobile(); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text2)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <i className="ti ti-x"></i>
            </button>
          )}
        </div>
        
        <nav className="nav">
          <div className="nav-section">Overview</div>
          <div 
            className={`nav-item ${currentView === 'overall-dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('overall-dashboard')}
          >
            <i className="ti ti-chart-pie"></i> Overall Dashboard
          </div>
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <i className="ti ti-layout-dashboard"></i> Expense Dashboard
          </div>
          <div 
            className={`nav-item ${currentView === 'income-dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('income-dashboard')}
          >
            <i className="ti ti-coin"></i> Income Dashboard
          </div>
          
          <div className="nav-section" style={{ marginTop: '12px' }}>Expenses & Transactions</div>
          <div 
            className={`nav-item ${currentView === 'all-expenses' ? 'active' : ''}`}
            onClick={() => handleNavClick('all-expenses')}
          >
            <i className="ti ti-list"></i> All Expenses <span className="badge">{expensesCount}</span>
          </div>
          <div 
            className={`nav-item ${currentView === 'all-incomes' ? 'active' : ''}`}
            onClick={() => handleNavClick('all-incomes')}
          >
            <i className="ti ti-arrow-down-left"></i> All Incomes <span className="badge">{incomesCount}</span>
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
    </>
  );
};

export default Sidebar;
