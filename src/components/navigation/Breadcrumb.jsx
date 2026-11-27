import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '../../constants/routes';

export const Breadcrumb = ({ items = [] }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-xs">
      <Link
        to={ROUTES.HOME}
        className="text-light-muted dark:text-dark-muted hover:text-primary transition-colors flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faHome} className="text-[11px]" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-light-muted/40 dark:text-dark-muted/40" />
            {isLast || !item.to ? (
              <span className="text-light-on-background dark:text-dark-on-background font-semibold">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="text-light-muted dark:text-dark-muted hover:text-primary transition-colors">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
