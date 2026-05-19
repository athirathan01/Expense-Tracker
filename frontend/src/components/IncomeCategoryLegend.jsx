import React from 'react';

const IncomeCategoryLegend = () => {
  return (
    <div className="cat-legend">
      <div className="legend-item">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#39d353', display: 'inline-block' }}></span>
        Salary
      </div>
      <div className="legend-item">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#58a6ff', display: 'inline-block' }}></span>
        Business Revenue
      </div>
      <div className="legend-item">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a371f7', display: 'inline-block' }}></span>
        Freelance
      </div>
      <div className="legend-item">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d29922', display: 'inline-block' }}></span>
        Investments
      </div>
      <div className="legend-item">
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f85149', display: 'inline-block' }}></span>
        Gifts & Bonus
      </div>
    </div>
  );
};

export default IncomeCategoryLegend;
