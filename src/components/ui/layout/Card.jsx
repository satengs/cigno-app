import React from 'react';
import { clsx } from 'clsx';

const Card = ({
  children,
  variant = 'default',
  padding = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'border shadow-sm',
    elevated: 'border shadow-lg',
    outlined: 'border-2',
    filled: 'border'
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const getCardStyles = () => {
    const baseStyles = {
      backgroundColor: 'var(--bg-secondary)',
      borderColor: 'var(--border-primary)',
      color: 'var(--text-primary)'
    };

    switch (variant) {
      case 'default':
        return { ...baseStyles, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' };
      case 'elevated':
        return { ...baseStyles, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' };
      case 'outlined':
        return { ...baseStyles, borderWidth: '2px' };
      case 'filled':
        return { ...baseStyles, backgroundColor: 'var(--bg-tertiary)' };
      default:
        return baseStyles;
    }
  };

  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-200',
        variants[variant],
        paddings[padding],
        className
      )}
      style={getCardStyles()}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
