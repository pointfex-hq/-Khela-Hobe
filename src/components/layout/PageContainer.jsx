import React from 'react';

export const PageContainer = ({
  children,
  maxWidth = 'max-w-7xl',
  className = '',
  as: Component = 'div',
  ...props
}) => {
  return (
    <Component
      className={`
        ${maxWidth} mx-auto w-full
        px-4 sm:px-6 lg:px-8
        py-6 sm:py-8 lg:py-10
        ${className}
      `}
      {...props}
    >
      {children}
    </Component>
  );
};

export default PageContainer;
