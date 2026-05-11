'use client';

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const disabledClass = disabled ? 'button--disabled' : '';

  return (
    <button
      type={type}
      className={`button ${variantClass} ${sizeClass} ${disabledClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
} 