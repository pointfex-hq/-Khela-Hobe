import React from 'react';

export const SectionContainer = ({
  children,
  id,
  hasBorder = false,
  className = '',
  as: Component = 'section',
  ...props
}) => {
  return (
    <Component
      id={id}
      className={`
        w-full py-12 lg:py-16
        ${hasBorder ? 'border-t border-light-border dark:border-dark-border' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </Component>
  );
};

export default SectionContainer;
