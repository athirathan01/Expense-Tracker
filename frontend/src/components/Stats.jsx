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

  // 2. This Week Spending (Monday to Sunday)
  const monday = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const thisWeekExpenses = expenses.filter(exp => {
    if (!exp.Expense_Date) return false;
    const expDate = new Date(exp.Expense_Date);
    return expDate >= monday && expDate <= sunday;
  });
  const thisWeekSum = thisWeekExpenses.reduce((sum, exp) => sum + Number(exp.Amount || 0), 0);

  // 3. Total entries
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
        <div className="stat-sub stat-dn">Mon to Sun</div>
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
