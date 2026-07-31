import React, { useState, useMemo } from 'react';

const CATEGORY_MAP = [
  {
    keywords: ['food', 'dining', 'restaurant', 'eat', 'pancake', 'chicken', 'rice'],
    name: 'Food & Dining',
    icon: '🍽',
    color: '#22c55e'
  },
  {
    keywords: ['transport', 'travel', 'cab', 'fuel', 'petrol', 'car'],
    name: 'Transport',
    icon: '🚗',
    color: '#38bdf8'
  },
  {
    keywords: ['shopping', 'dress', 'electronic', 'amazon', 'cloth'],
    name: 'Shopping',
    icon: '🛍',
    color: '#a78bfa'
  },
  {
    keywords: ['utility', 'utilities', 'electricity', 'water', 'wifi', 'bill', 'recharge'],
    name: 'Utilities & Bills',
    icon: '⚡',
    color: '#facc15'
  },
  {
    keywords: ['health', 'pharmacy', 'doctor', 'medical', 'medicine', 'hospital'],
    name: 'Health & Medical',
    icon: '💊',
    color: '#f87171'
  },
  {
    keywords: ['entertainment', 'movie', 'show', 'game', 'fun', 'netflix'],
    name: 'Entertainment',
    icon: '🎬',
    color: '#fb923c'
  },
  {
    keywords: ['education', 'book', 'school', 'college', 'course', 'fees'],
    name: 'Education',
    icon: '📚',
    color: '#34d399'
  },
  {
    keywords: ['housing', 'rent', 'house', 'room', 'flat'],
    name: 'Housing & Rent',
    icon: '🏠',
    color: '#60a5fa'
  },
  {
    keywords: ['personal', 'care', 'salon', 'barber', 'spa', 'haircut'],
    name: 'Personal Care',
    icon: '💈',
    color: '#f472b6'
  },
  {
    keywords: ['miscellaneous', 'misc', 'other', 'general'],
    name: 'Miscellaneous',
    icon: '📦',
    color: '#94a3b8'
  }
];

const hexToRGBA = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ExpenseList = ({ expenses, searchQuery = '', isAllExpensesView = false, onEdit, onDelete, onViewAll }) => {
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const getCategoryStyles = (categoryObj) => {
    const categoryName = categoryObj ? categoryObj.name : 'Miscellaneous';
    const nameLower = categoryName.toLowerCase();
    
    // Find matching category config
    let match = CATEGORY_MAP.find(cat => nameLower === cat.name.toLowerCase());
    if (!match) {
      match = CATEGORY_MAP.find(cat => 
        cat.keywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'i');
          return regex.test(nameLower);
        })
      );
    }

    const config = match || {
      name: categoryName,
      icon: '📦',
      color: '#94a3b8'
    };

    return {
      dotColor: config.color,
      categoryText: `${config.icon} ${config.name}`,
      categoryName: config.name,
      style: {
        color: config.color,
        borderColor: hexToRGBA(config.color, 0.3),
        background: hexToRGBA(config.color, 0.1)
      }
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Extract unique months dynamically from all expenses
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set();
    const months = [];
    
    expenses.forEach(exp => {
      if (!exp.Expense_Date) return;
      const date = new Date(exp.Expense_Date);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      
      // format: "May 2026"
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      
      if (!monthsSet.has(key)) {
        monthsSet.add(key);
        months.push({ key, label });
      }
    });
    
    return months.sort((a, b) => b.key.localeCompare(a.key));
  }, [expenses]);

  const handleToggleCategory = (categoryName) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const handleClearFilters = () => {
    setSelectedMonth('all');
    setSelectedCategories([]);
  };

  // Filter expenses based on selected month, categories and search query
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // 0. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const desc = (exp.Note || exp.Name || '').toLowerCase();
        const cat = (exp.Expense_Type?.name || 'Miscellaneous').toLowerCase();
        const method = (exp.Payment_Method || '').toLowerCase();
        const amount = String(exp.Amount || '');
        if (!desc.includes(query) && !cat.includes(query) && !method.includes(query) && !amount.includes(query)) {
          return false;
        }
      }

      // 1. Month filter
      if (selectedMonth !== 'all') {
        if (!exp.Expense_Date) return false;
        const date = new Date(exp.Expense_Date);
        if (isNaN(date.getTime())) return false;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        if (key !== selectedMonth) return false;
      }
      
      // 2. Category filter
      if (selectedCategories.length > 0) {
        const styles = getCategoryStyles(exp.Expense_Type);
        if (!selectedCategories.includes(styles.categoryName)) {
          return false;
        }
      }
      
      return true;
    });
  }, [expenses, selectedMonth, selectedCategories, searchQuery]);

  return (
    <>
      {!isAllExpensesView && (
        <div className="section-header">
          <span className="section-title">Recent expenses</span>
          {onViewAll && (
            <button className="btn" onClick={onViewAll} style={{ padding: '3px 8px', fontSize: '11px', height: '24px' }}>
              View All <i className="ti ti-chevron-right" style={{ fontSize: '10px' }}></i>
            </button>
          )}
        </div>
      )}

      {isAllExpensesView && (
        <div className="filters-container">
          <div className="filter-row">
            <span className="filter-label">Month</span>
            <div className="filter-control-wrap">
              <select 
                className="month-select" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {uniqueMonths.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            
            {(selectedMonth !== 'all' || selectedCategories.length > 0) && (
              <button className="filter-clear-btn" onClick={handleClearFilters}>
                <i className="ti ti-x"></i> Clear Filters
              </button>
            )}
          </div>
          
          <div className="filter-row" style={{ marginTop: '4px' }}>
            <span className="filter-label">Category</span>
            <div className="filter-control-wrap">
              {CATEGORY_MAP.map(cat => {
                const isSelected = selectedCategories.includes(cat.name);
                const activeStyle = isSelected ? {
                  background: hexToRGBA(cat.color, 0.15),
                  borderColor: hexToRGBA(cat.color, 0.4),
                  color: cat.color,
                  fontWeight: '600',
                  boxShadow: `0 0 8px ${hexToRGBA(cat.color, 0.15)}`
                } : {};
                
                return (
                  <span 
                    key={cat.name} 
                    className={`filter-badge ${isSelected ? 'active' : ''}`}
                    style={activeStyle}
                    onClick={() => handleToggleCategory(cat.name)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="filter-summary">
            <span>
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </span>
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>
              Total: ₹{filteredExpenses.reduce((sum, exp) => sum + Number(exp.Amount || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      <div className="expense-list">
        <div className="list-header">
          <span></span>
          <span>Description</span>
          <span>Category</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '36px', background: 'var(--bg2)', borderRadius: '8px' }}>
            {expenses.length === 0 ? (
              "No expenses found in CRM."
            ) : (
              <div>
                <p style={{ marginBottom: '12px' }}>No expenses match the selected filters or search query.</p>
                <button className="btn" onClick={handleClearFilters} style={{ fontSize: '12px' }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const styles = getCategoryStyles(exp.Expense_Type);
            return (
              <div className="list-row" key={exp.id}>
                <div className="cat-dot" style={{ background: styles.dotColor }}></div>
                <div>
                  <div className="row-desc">{exp.Note || exp.Name}</div>
                  <div className="row-note">
                    {exp.Payment_Method ? `payment_method: ${exp.Payment_Method}` : ''}
                  </div>
                </div>
                <div>
                  <span className="cat-pill" style={styles.style}>{styles.categoryText}</span>
                </div>
                <div className="row-date">{formatDate(exp.Expense_Date)}</div>
                <div className="row-amount">
                  ₹{Number(exp.Amount || 0).toLocaleString('en-IN')}
                  <div className="row-actions">
                    <span className="icon-btn" onClick={() => onEdit && onEdit(exp)} title="Edit Expense">
                      <i className="ti ti-edit"></i>
                    </span>
                    <span className="icon-btn" onClick={() => onDelete && onDelete(exp.id)} title="Delete Expense">
                      <i className="ti ti-trash"></i>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default ExpenseList;
export { CATEGORY_MAP, hexToRGBA };
