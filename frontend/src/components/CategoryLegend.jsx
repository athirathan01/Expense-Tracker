import React from 'react';
import { CATEGORY_MAP } from './ExpenseList';

const CategoryLegend = () => {
  return (
    <div className="cat-legend">
      {CATEGORY_MAP.map((cat) => (
        <div className="legend-item" key={cat.name}>
          <span 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: cat.color, 
              display: 'inline-block' 
            }}
          ></span>
          <span style={{ marginLeft: '4px' }}>
            {cat.icon} {cat.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryLegend;
