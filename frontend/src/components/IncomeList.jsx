import React from 'react';

const IncomeList = ({ incomes, isAllIncomesView = false, onEdit, onDelete }) => {
  const getCategoryStyles = (categoryObj) => {
    const categoryName = categoryObj ? categoryObj.name : 'Other';
    const name = categoryName.toLowerCase();
    
    if (name.includes('salary') || name.includes('pay') || name.includes('wage')) {
      return { dotColor: '#39d353', pillClass: 'pill-food', categoryText: `💼 ${categoryName}` };
    }
    if (name.includes('business') || name.includes('sale') || name.includes('client') || name.includes('revenue')) {
      return { dotColor: '#58a6ff', pillClass: 'pill-transport', categoryText: `🏢 ${categoryName}` };
    }
    if (name.includes('freelance') || name.includes('project') || name.includes('gigs') || name.includes('consulting')) {
      return { dotColor: '#a371f7', pillClass: 'pill-shopping', categoryText: `💻 ${categoryName}` };
    }
    if (name.includes('investment') || name.includes('dividend') || name.includes('interest') || name.includes('stock')) {
      return { dotColor: '#d29922', pillClass: 'pill-utilities', categoryText: `📈 ${categoryName}` };
    }
    if (name.includes('gift') || name.includes('bonus') || name.includes('reward')) {
      return { dotColor: '#f85149', pillClass: 'pill-health', categoryText: `🎁 ${categoryName}` };
    }
    // Default fallback
    return { dotColor: '#8b949e', pillClass: '', categoryText: `🏷 ${categoryName}` };
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
      {!isAllIncomesView && (
        <div className="section-header">
          <span className="section-title">Recent incomes</span>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{incomes.length} total entries</span>
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

        {incomes.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '24px' }}>No incomes found in CRM.</div>
        ) : (
          incomes.map((inc) => {
            const styles = getCategoryStyles(inc.Income_Type);
            return (
              <div className="list-row" key={inc.id}>
                <div className="cat-dot" style={{ background: styles.dotColor }}></div>
                <div>
                  <div className="row-desc">{inc.Note || inc.Name}</div>
                  <div className="row-note">
                    {inc.Payment_Mode ? `received_to: ${inc.Payment_Mode}` : ''}
                  </div>
                </div>
                <div>
                  <span className={`cat-pill ${styles.pillClass}`}>{styles.categoryText}</span>
                </div>
                <div className="row-date">{formatDate(inc.Income_Date)}</div>
                <div className="row-amount" style={{ color: 'var(--green)' }}>
                  + ₹{Number(inc.Amount || 0).toLocaleString('en-IN')}
                  <div className="row-actions">
                    <span className="icon-btn" onClick={() => onEdit && onEdit(inc)} title="Edit Income">
                      <i className="ti ti-edit"></i>
                    </span>
                    <span className="icon-btn" onClick={() => onDelete && onDelete(inc.id)} title="Delete Income">
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

export default IncomeList;
