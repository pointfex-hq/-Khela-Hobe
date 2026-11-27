import React from 'react';

export const ResponsiveGrid = ({
  children,
  columns = 3, // 1 | 2 | 3 | 4
  gap = 'gap-6',
  className = '',
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div
      className={`
        grid ${columnClasses[columns] || columnClasses[3]}
        ${gap} items-stretch ${className}
      `}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;
