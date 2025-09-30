import React from 'react';
import { clsx } from 'clsx';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'shadow-sm border',
    secondary: 'border',
    outline: 'border',
    ghost: '',
    danger: 'shadow-sm border',
    success: 'shadow-sm border'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const getButtonStyles = () => {
    const baseStyles = {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-primary)',
      outline: 'none'
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)'
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-primary)'
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: 'none'
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: '#dc2626',
          color: 'white',
          borderColor: '#dc2626'
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#16a34a',
          color: 'white',
          borderColor: '#16a34a'
        };
      default:
        return baseStyles;
    }
  };

  const getHoverStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'var(--bg-tertiary)' };
      case 'secondary':
        return { backgroundColor: 'var(--bg-tertiary)' };
      case 'outline':
        return { backgroundColor: 'var(--bg-secondary)' };
      case 'ghost':
        return { backgroundColor: 'var(--bg-secondary)' };
      case 'danger':
        return { backgroundColor: '#b91c1c' };
      case 'success':
        return { backgroundColor: '#15803d' };
      default:
        return { backgroundColor: 'var(--bg-tertiary)' };
    }
  };

  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      style={getButtonStyles()}
      onMouseEnter={(e) => {
        const hoverStyles = getHoverStyles();
        Object.assign(e.target.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        const originalStyles = getButtonStyles();
        Object.assign(e.target.style, originalStyles);
      }}
      onFocus={(e) => {
        e.target.style.boxShadow = '0 0 0 2px rgba(147, 51, 234, 0.2)';
      }}
      onBlur={(e) => {
        const originalStyles = getButtonStyles();
        e.target.style.boxShadow = originalStyles.boxShadow || 'none';
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className={clsx('animate-spin -ml-1 mr-2', iconSizes[size])} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={clsx('mr-2', iconSizes[size])}>
          {icon}
        </span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={clsx('ml-2', iconSizes[size])}>
          {icon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
