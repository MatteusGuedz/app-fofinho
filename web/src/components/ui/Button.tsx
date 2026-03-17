import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  iconLeft?: ReactNode;
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  loading,
  iconLeft,
  disabled,
  ...rest
}: ButtonProps) {
  const base = 'btn';
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'outline'
        ? 'btn-outline'
        : 'btn-ghost';

  return (
    <button
      type="button"
      className={`${base} ${variantClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {iconLeft && <span className="btn-icon-left">{iconLeft}</span>}
      <span>{children}</span>
    </button>
  );
}

