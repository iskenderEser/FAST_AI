'use client';

export function Pill({ children, variant = 'default', selected = false, onClick, className = '', ...props }) {
  const Element = onClick ? 'button' : 'span';

  return (
    <Element
      className={`pill pill--${variant}${selected ? ' pill--selected' : ''}${onClick ? ' pill--clickable' : ''} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </Element>
  );
}