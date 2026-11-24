import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../constants/icons';

/**
 * Standardized Icon Component
 * Strictly renders Font Awesome icons through a central catalog.
 */
export const Icon = ({
  name,
  icon,
  size = '1x',
  className = '',
  spin = false,
  ariaLabel,
  ...props
}) => {
  const iconDefinition = icon || (name ? ICONS[name] : null);

  if (!iconDefinition) {
    console.warn(`[Icon] Icon '${name}' not found in ICONS dictionary.`);
    return null;
  }

  return (
    <FontAwesomeIcon
      icon={iconDefinition}
      size={size}
      spin={spin}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      {...props}
    />
  );
};

export default Icon;
