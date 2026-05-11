'use client';

export function Card({ children, variant = 'default', hoverable = true, className = '', ...props }) {
  const variantClass = `card card--${variant}${hoverable ? ' card--hoverable' : ''}`;
  const finalClassName = `${variantClass} ${className}`.trim();
  return <div className={finalClassName} {...props}>{children}</div>;
}

export function CardHeader({ children, className = '', ...props }) {
  return <div className={`card__header ${className}`.trim()} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }) {
  return <div className={`card__title ${className}`.trim()} {...props}>{children}</div>;
}

export function CardDescription({ children, className = '', ...props }) {
  return <div className={`card__description ${className}`.trim()} {...props}>{children}</div>;
}

export function CardContent({ children, className = '', padded = true, ...props }) {
  return <div className={`card__content${padded ? ' card__content--padded' : ''} ${className}`.trim()} {...props}>{children}</div>;
}

export function CardActions({ children, className = '', ...props }) {
  return <div className={`card__actions ${className}`.trim()} {...props}>{children}</div>;
}