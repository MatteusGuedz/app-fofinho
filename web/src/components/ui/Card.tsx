import type { ReactNode } from 'react';

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function Card({ title, subtitle, children }: CardProps) {
  return (
    <section className="card">
      {(title || subtitle) && (
        <header className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

