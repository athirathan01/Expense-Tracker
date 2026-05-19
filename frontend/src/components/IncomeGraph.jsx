import React, { useState } from 'react';

const IncomeGraph = ({ incomes }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySums = Array(12).fill(0);

  // Group Zoho CRM incomes into the current year's months
  incomes.forEach(inc => {
    if (!inc.Income_Date) return;
    const incDate = new Date(inc.Income_Date);
    if (incDate.getFullYear() === currentYear) {
      const incMonth = incDate.getMonth(); // 0-11
      monthlySums[incMonth] += Number(inc.Amount || 0);
    }
  });

  const vals = monthlySums;
  const max = Math.max(...vals) || 1;
  const totalPeriodSum = vals.reduce((a, b) => a + b, 0);

  const [activeIndex, setActiveIndex] = useState(now.getMonth());

  return (
    <div className="graph-wrap">
      <div className="section-header">
        <span className="section-title">Income activity — {currentYear}</span>
        <span style={{ fontSize: '12px', color: 'var(--green)' }}>₹{totalPeriodSum.toLocaleString('en-IN')} this period</span>
      </div>
      <div className="graph-grid" id="income-bar-graph">
        {vals.map((v, i) => {
          const height = Math.round((v / max) * 48);
          const amount = v.toLocaleString('en-IN');
          return (
            <div
              key={i}
              className={`graph-bar ${i === activeIndex ? 'active' : ''}`}
              style={{ height: `${height}px` }}
              title={`${months[i]}: ₹${amount}`}
              onClick={() => {
                setActiveIndex(i);
              }}
            ></div>
          );
        })}
      </div>
      <div className="graph-months" id="income-bar-labels">
        {months.map((month, i) => (
          <div key={i} className={`graph-month ${i === activeIndex ? 'active' : ''}`}>
            {month}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeGraph;
