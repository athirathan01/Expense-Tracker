import React from 'react';

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

const ExpenseList = ({ expenses, isAllExpensesView = false, onEdit, onDelete, onViewAll }) => {
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
      <div className="expense-list">
        <div className="list-header">
          <span></span>
          <span>Description</span>
          <span>Category</span>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>

        {expenses.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '24px' }}>No expenses found in CRM.</div>
        ) : (
          expenses.map((exp) => {
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
