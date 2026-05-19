import React from 'react';

const IncomeStats = ({ incomes }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. This Month Income
  const thisMonthIncomes = incomes.filter(inc => {
    if (!inc.Income_Date) return false;
    const incDate = new Date(inc.Income_Date);
    return incDate.getFullYear() === currentYear && incDate.getMonth() === currentMonth;
  });
  const thisMonthSum = thisMonthIncomes.reduce((sum, inc) => sum + Number(inc.Amount || 0), 0);

  // 2. This Week Income (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const thisWeekIncomes = incomes.filter(inc => {
    if (!inc.Income_Date) return false;
    const incDate = new Date(inc.Income_Date);
    return incDate >= oneWeekAgo && incDate <= now;
  });
  const thisWeekSum = thisWeekIncomes.reduce((sum, inc) => sum + Number(inc.Amount || 0), 0);

  // 3. Monthly Income Target progress
  const targetBaseline = 50000;
  const targetPercent = Math.min(100, ((thisMonthSum / targetBaseline) * 100)).toFixed(1);

  // 4. Total entries
  const totalEntries = incomes.length;
  const uniqueCategories = new Set(
    incomes.map(inc => inc.Income_Type?.id).filter(Boolean)
  ).size;

  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-label">This month</div>
        <div className="stat-value" style={{ color: 'var(--green)' }}>₹{thisMonthSum.toLocaleString('en-IN')}</div>
        <div className="stat-sub stat-dn">Live Zoho CRM data</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">This week</div>
        <div className="stat-value" style={{ color: 'var(--green)' }}>₹{thisWeekSum.toLocaleString('en-IN')}</div>
        <div className="stat-sub stat-dn">Last 7 days</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Monthly Target</div>
        <div className="stat-value">₹{targetBaseline.toLocaleString('en-IN')}</div>
        <div className="stat-sub" style={{ color: 'var(--blue)' }}>{targetPercent}% achieved</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total entries</div>
        <div className="stat-value">{totalEntries}</div>
        <div className="stat-sub">across {uniqueCategories} categories</div>
      </div>
    </div>
  );
};

export default IncomeStats;
