import React from 'react';

export const Table = ({ columns = [], data = [], keyExtractor, className = '' }) => {
  return (
    <div className={`overflow-x-auto rounded-lg border border-light-border dark:border-dark-border ${className}`}>
      <table className="w-full text-left border-collapse font-body text-xs sm:text-sm">
        <thead className="bg-light-surface-elevated dark:bg-dark-surface-elevated border-b border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted font-label uppercase text-[11px] tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-light-border/60 dark:divide-dark-border/60 bg-light-surface dark:bg-dark-surface">
          {data.map((row, rowIdx) => {
            const key = keyExtractor ? keyExtractor(row) : rowIdx;
            return (
              <tr key={key} className="hover:bg-light-surface-elevated/50 dark:hover:bg-dark-surface-elevated/50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-light-on-surface dark:text-dark-on-surface">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
