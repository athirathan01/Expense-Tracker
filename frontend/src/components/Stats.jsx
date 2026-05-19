import React from 'react';

const Stats = ({ expenses }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. This Month Spending
  const thisMonthExpenses = expenses.filter(exp => {
    if (!exp.Expense_Date) return false;
    const expDate = new Date(exp.Expense_Date);
    return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
  });
  const thisMonthSum = thisMonthExpenses.reduce((sum, exp) => sum + Number(exp.Amount || 0), 0);

  // 2. This Week Spending (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const thisWeekExpenses = expenses.filter(exp => {
    if (!exp.Expense_Date) return false;
    const expDate = new Date(exp.Expense_Date);
    return expDate >= oneWeekAgo && expDate <= now;
  });
  const thisWeekSum = thisWeekExpenses.reduce((sum, exp) => sum + Number(exp.Amount || 0), 0);

  // 3. Budget Left (₹25,000 monthly baseline)
  const budgetBaseline = 25000;
  const budgetLeft = Math.max(0, budgetBaseline - thisMonthSum);
  const budgetPercent = ((budgetLeft / budgetBaseline) * 100).toFixed(1);

  // 4. Total entries
  const totalEntries = expenses.length;
  const uniqueCategories = new Set(
    expenses.map(exp => exp.Expense_Type?.id).filter(Boolean)
  ).size;

  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-label">This month</div>
        <div className="stat-value">₹{thisMonthSum.toLocaleString('en-IN')}</div>
        <div className="stat-sub stat-up">Live Zoho CRM data</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">This week</div>
        <div className="stat-value">₹{thisWeekSum.toLocaleString('en-IN')}</div>
        <div className="stat-sub stat-dn">Last 7 days</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Budget left</div>
        <div className="stat-value">₹{budgetLeft.toLocaleString('en-IN')}</div>
        <div className="stat-sub" style={{ color: 'var(--amber)' }}>{budgetPercent}% remaining</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Total entries</div>
        <div className="stat-value">{totalEntries}</div>
        <div className="stat-sub">across {uniqueCategories} categories</div>
      </div>
    </div>
  );
};

export default Stats;
