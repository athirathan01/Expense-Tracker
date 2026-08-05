import React, { useState, useMemo } from 'react';
import { CATEGORY_MAP, hexToRGBA } from './ExpenseList';

const OverallDashboard = ({ 
  expenses, 
  incomes, 
  searchQuery = '', 
  timeFilter = { mode: 'all' }, 
  onEditExpense, 
  onDeleteExpense, 
  onEditIncome, 
  onDeleteIncome 
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Date Filtering Logic based on Topbar timeFilter prop
  const isDateInFilter = (dateStr) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;

    if (!timeFilter || timeFilter.mode === 'all') return true;

    const itemYear = itemDate.getFullYear();
    const itemMonth = itemDate.getMonth();
    const itemDay = itemDate.getDate();

    if (timeFilter.mode === 'year') {
      return itemYear === Number(timeFilter.year || currentYear);
    }

    if (timeFilter.mode === 'month') {
      return itemYear === Number(timeFilter.year || currentYear) && itemMonth === Number(timeFilter.month ?? now.getMonth());
    }

    if (timeFilter.mode === 'week') {
      const monday = new Date(now);
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      return itemDate >= monday && itemDate <= sunday;
    }

    if (timeFilter.mode === 'day') {
      if (!timeFilter.date) return true;
      const [y, m, d] = timeFilter.date.split('-').map(Number);
      return itemYear === y && itemMonth === (m - 1) && itemDay === d;
    }

    if (timeFilter.mode === 'custom') {
      if (!timeFilter.customFrom && !timeFilter.customTo) return true;
      const fromTime = timeFilter.customFrom ? new Date(timeFilter.customFrom).setHours(0, 0, 0, 0) : 0;
      const toTime = timeFilter.customTo ? new Date(timeFilter.customTo).setHours(23, 59, 59, 999) : Infinity;
      const itemTime = itemDate.getTime();
      return itemTime >= fromTime && itemTime <= toTime;
    }

    return true;
  };

  // Filtered Expenses and Incomes
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => isDateInFilter(exp.Expense_Date));
  }, [expenses, timeFilter]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(inc => isDateInFilter(inc.Income_Date));
  }, [incomes, timeFilter]);

  // 1. Stats Calculations
  const totalIncome = useMemo(() => filteredIncomes.reduce((sum, inc) => sum + Number(inc.Amount || 0), 0), [filteredIncomes]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + Number(exp.Amount || 0), 0), [filteredExpenses]);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((netBalance / totalIncome) * 100))) : 0;

  // 2. Spending by Category Calculation for Donut Chart
  const categorySpending = useMemo(() => {
    const map = {};
    let total = 0;
    filteredExpenses.forEach(exp => {
      const amt = Number(exp.Amount || 0);
      const catName = exp.Expense_Type?.name || 'Miscellaneous';
      map[catName] = (map[catName] || 0) + amt;
      total += amt;
    });

    const defaultColors = ['#4F46E5', '#E8604C', '#F7B733', '#12B76A', '#8177F0', '#0EA5E9', '#EC4899'];

    const list = Object.entries(map).map(([name, amount], idx) => {
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      let match = CATEGORY_MAP.find(c => name.toLowerCase() === c.name.toLowerCase());
      const color = match ? match.color : defaultColors[idx % defaultColors.length];
      return { name, amount, pct, color };
    }).sort((a, b) => b.amount - a.amount);

    return { list: list.slice(0, 4), total };
  }, [filteredExpenses]);

  const formatShortAmount = (num) => {
    if (num >= 100000) return `₹${(num / 1000).toFixed(0)}K`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  // 3. Monthly Comparison Calculations
  const activeYearForGraph = timeFilter?.mode === 'year' || timeFilter?.mode === 'month' 
    ? Number(timeFilter.year || currentYear) 
    : currentYear;

  const monthlyIncomes = useMemo(() => {
    const sums = Array(12).fill(0);
    incomes.forEach(inc => {
      if (!inc.Income_Date) return;
      const date = new Date(inc.Income_Date);
      if (date.getFullYear() === activeYearForGraph) {
        sums[date.getMonth()] += Number(inc.Amount || 0);
      }
    });
    return sums;
  }, [incomes, activeYearForGraph]);

  const monthlyExpenses = useMemo(() => {
    const sums = Array(12).fill(0);
    expenses.forEach(exp => {
      if (!exp.Expense_Date) return;
      const date = new Date(exp.Expense_Date);
      if (date.getFullYear() === activeYearForGraph) {
        sums[date.getMonth()] += Number(exp.Amount || 0);
      }
    });
    return sums;
  }, [expenses, activeYearForGraph]);

  const maxMonthValue = useMemo(() => {
    return Math.max(...monthlyIncomes, ...monthlyExpenses) || 1;
  }, [monthlyIncomes, monthlyExpenses]);

  const [activeIndex, setActiveIndex] = useState(now.getMonth());

  // 4. Merging and Filtering Transactions
  const mergedTransactions = useMemo(() => {
    const list = [
      ...filteredExpenses.map(e => ({ ...e, type: 'expense', dateStr: e.Expense_Date })),
      ...filteredIncomes.map(i => ({ ...i, type: 'income', dateStr: i.Income_Date }))
    ];

    return list.sort((a, b) => {
      const dateA = a.dateStr ? new Date(a.dateStr).getTime() : 0;
      const dateB = b.dateStr ? new Date(b.dateStr).getTime() : 0;
      const isNaNA = isNaN(dateA);
      const isNaNB = isNaN(dateB);
      if (isNaNA && isNaNB) return String(b.id || '').localeCompare(String(a.id || ''));
      if (isNaNA) return 1;
      if (isNaNB) return -1;
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [filteredExpenses, filteredIncomes]);

  const searchedTransactions = useMemo(() => {
    return mergedTransactions.filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const desc = (item.Note || item.Name || '').toLowerCase();
        const cat = (item.type === 'expense' 
          ? (item.Expense_Type?.name || 'Miscellaneous') 
          : (item.Income_Type?.name || 'Other')
        ).toLowerCase();
        const method = (item.type === 'expense' ? item.Payment_Method : item.Payment_Mode || '').toLowerCase();
        const amount = String(item.Amount || '');
        if (!desc.includes(query) && !cat.includes(query) && !method.includes(query) && !amount.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [mergedTransactions, searchQuery]);

  const getTransactionStyles = (item) => {
    if (item.type === 'expense') {
      const categoryName = item.Expense_Type ? item.Expense_Type.name : 'Miscellaneous';
      const nameLower = categoryName.toLowerCase();
      
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
    } else {
      const categoryName = item.Income_Type ? item.Income_Type.name : 'Other';
      const name = categoryName.toLowerCase();
      
      let dotColor = '#8b949e';
      let style = { color: '#8b949e', borderColor: 'rgba(139, 148, 158, 0.3)', background: 'rgba(139, 148, 158, 0.1)' };
      let icon = '🏷';

      if (name.includes('salary') || name.includes('pay') || name.includes('wage')) {
        dotColor = '#39d353';
        icon = '💼';
        style = { color: '#39d353', borderColor: 'rgba(57, 211, 83, 0.3)', background: 'rgba(57, 211, 83, 0.1)' };
      } else if (name.includes('business') || name.includes('sale') || name.includes('client') || name.includes('revenue')) {
        dotColor = '#58a6ff';
        icon = '🏢';
        style = { color: '#58a6ff', borderColor: 'rgba(88, 166, 255, 0.3)', background: 'rgba(88, 166, 255, 0.1)' };
      } else if (name.includes('freelance') || name.includes('project') || name.includes('gigs') || name.includes('consulting')) {
        dotColor = '#a371f7';
        icon = '💻';
        style = { color: '#a371f7', borderColor: 'rgba(163, 113, 247, 0.3)', background: 'rgba(163, 113, 247, 0.1)' };
      } else if (name.includes('investment') || name.includes('dividend') || name.includes('interest') || name.includes('stock')) {
        dotColor = '#d29922';
        icon = '📈';
        style = { color: '#d29922', borderColor: 'rgba(210, 153, 34, 0.3)', background: 'rgba(210, 153, 34, 0.1)' };
      } else if (name.includes('gift') || name.includes('bonus') || name.includes('reward')) {
        dotColor = '#f85149';
        icon = '🎁';
        style = { color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.3)', background: 'rgba(248, 81, 73, 0.1)' };
      }

      return {
        dotColor,
        categoryText: `${icon} ${categoryName}`,
        style
      };
    }
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
      {/* 1. Hero Banner Row (Net Balance Card + Spending By Category Donut Card) */}
      <div className="overall-hero-row">
        {/* Left: Net Balance Card */}
        <div className="hero-balance-card">
          <div>
            <div className="hero-balance-label">NET BALANCE</div>
            <div className="hero-balance-val" style={{ color: netBalance >= 0 ? 'var(--green)' : 'var(--red)' }}>
              ₹{netBalance.toLocaleString('en-IN')}
            </div>
            <div className="hero-sub-stats">
              <div className="hero-sub-item">
                <div className="hero-sub-title">
                  <span style={{ color: 'var(--green)' }}>●</span> INCOME
                </div>
                <div className="hero-sub-val" style={{ color: 'var(--green)' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
              </div>
              <div className="hero-sub-item">
                <div className="hero-sub-title">
                  <span style={{ color: 'var(--red)' }}>●</span> EXPENSES
                </div>
                <div className="hero-sub-val" style={{ color: 'var(--red)' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
              </div>
              <div className="hero-sub-item">
                <div className="hero-sub-title">SAVED</div>
                <div className="hero-sub-val" style={{ color: 'var(--blue)' }}>{savingsRate}%</div>
              </div>
            </div>
          </div>

          {/* Smooth sparkline wave curve graphic at the bottom */}
          <svg className="sparkline-svg" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path 
              d="M 0,30 Q 50,15 100,25 T 200,18 T 300,10 T 400,5" 
              fill="none" 
              stroke="var(--blue)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>

        {/* Right: Spending By Category Donut Card */}
        <div className="category-spending-card">
          <div className="category-spending-title">SPENDING BY CATEGORY</div>
          <div className="category-spending-body">
            <div className="donut-chart-wrap">
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg3)" strokeWidth="11" />
                {categorySpending.list.reduce((acc, cat) => {
                  const strokeDasharray = `${(cat.pct / 100) * 238.76} 238.76`;
                  const strokeDashoffset = -acc.offset;
                  acc.elements.push(
                    <circle
                      key={cat.name}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth="11"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                  acc.offset += (cat.pct / 100) * 238.76;
                  return acc;
                }, { offset: 0, elements: [] }).elements}
              </svg>
              <div className="donut-center-text">
                {formatShortAmount(categorySpending.total)}
              </div>
            </div>

            <div className="category-legend-list">
              {categorySpending.list.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>No expense category data</div>
              ) : (
                categorySpending.list.map(cat => (
                  <div className="category-legend-item" key={cat.name}>
                    <span className="legend-dot" style={{ background: cat.color }}></span>
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    <span className="legend-pct">· {cat.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Comparison Graph */}
      <div className="graph-wrap">
        <div className="section-header">
          <span className="section-title">Income vs Expenses — {activeYearForGraph}</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
            Selected: <strong>{months[activeIndex]}</strong> (Income: <span style={{ color: 'var(--green)' }}>₹{monthlyIncomes[activeIndex].toLocaleString('en-IN')}</span> / Expense: <span style={{ color: 'var(--red)' }}>₹{monthlyExpenses[activeIndex].toLocaleString('en-IN')}</span>)
          </span>
        </div>
        <div className="graph-grid" style={{ gap: '6px' }}>
          {months.map((month, i) => {
            const incVal = monthlyIncomes[i];
            const expVal = monthlyExpenses[i];
            const incHeight = Math.round((incVal / maxMonthValue) * 48);
            const expHeight = Math.round((expVal / maxMonthValue) * 48);

            return (
              <div 
                key={month} 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  gap: '2px', 
                  alignItems: 'flex-end', 
                  height: '100%', 
                  borderRadius: '4px',
                  background: i === activeIndex ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  padding: '2px',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveIndex(i)}
              >
                <div 
                  className={`graph-bar ${i === activeIndex ? 'active' : ''}`}
                  style={{ 
                    height: `${incHeight}px`, 
                    background: 'linear-gradient(to top, var(--green-bg), var(--green))',
                    flex: 1
                  }}
                  title={`${month} Income: ₹${incVal.toLocaleString('en-IN')}`}
                ></div>
                <div 
                  className={`graph-bar ${i === activeIndex ? 'active' : ''}`}
                  style={{ 
                    height: `${expHeight}px`, 
                    background: 'linear-gradient(to top, var(--red-bg), var(--red))',
                    flex: 1
                  }}
                  title={`${month} Expenses: ₹${expVal.toLocaleString('en-IN')}`}
                ></div>
              </div>
            );
          })}
        </div>
        <div className="graph-months">
          {months.map((month, i) => (
            <div 
              key={month} 
              className={`graph-month ${i === activeIndex ? 'active' : ''}`}
              style={{ flex: 1, fontWeight: i === activeIndex ? '600' : 'normal', color: i === activeIndex ? 'var(--text)' : 'var(--text3)' }}
            >
              {month}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Combined Recent Transactions List */}
      <div className="section-header">
        <span className="section-title">Recent Transactions</span>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
          Showing {searchedTransactions.length} of {mergedTransactions.length} items
        </span>
      </div>

      <div className="expense-list">
        <div className="list-header">
          <span></span>
          <span>Description</span>
          <span className="col-category">Category</span>
          <span className="col-date">Date</span>
          <span style={{ textAlign: 'right' }}>Amount</span>
        </div>

        {searchedTransactions.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '36px', background: 'var(--bg2)', borderRadius: '8px' }}>
            {mergedTransactions.length === 0 ? "No transactions match the selected filter." : "No transactions match the search query."}
          </div>
        ) : (
          searchedTransactions.map((item) => {
            const styles = getTransactionStyles(item);
            const isExpense = item.type === 'expense';
            return (
              <div className="list-row" key={`${item.type}-${item.id}`}>
                <div className="cat-dot" style={{ background: styles.dotColor }}></div>
                <div>
                  <div className="row-desc">{item.Note || item.Name}</div>
                  <div className="row-note">
                    {isExpense 
                      ? (item.Payment_Method ? `expense • payment_method: ${item.Payment_Method}` : 'expense')
                      : (item.Payment_Mode ? `income • received_to: ${item.Payment_Mode}` : 'income')
                    }
                  </div>
                </div>
                <div className="row-category">
                  <span className="cat-pill" style={styles.style}>{styles.categoryText}</span>
                </div>
                <div className="row-date">{formatDate(item.dateStr)}</div>
                <div className="row-amount" style={{ color: isExpense ? 'var(--text)' : 'var(--green)' }}>
                  {isExpense ? '-' : '+'} ₹{Number(item.Amount || 0).toLocaleString('en-IN')}
                  <div className="row-actions">
                    <span 
                      className="icon-btn" 
                      onClick={() => isExpense ? onEditExpense(item) : onEditIncome(item)} 
                      title={isExpense ? "Edit Expense" : "Edit Income"}
                    >
                      <i className="ti ti-edit"></i>
                    </span>
                    <span 
                      className="icon-btn" 
                      onClick={() => isExpense ? onDeleteExpense(item.id) : onDeleteIncome(item.id)} 
                      title={isExpense ? "Delete Expense" : "Delete Income"}
                    >
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

export default OverallDashboard;
