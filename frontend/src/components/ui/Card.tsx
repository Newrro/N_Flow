'use client';

import styles from './Card.module.css';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  icon?: string;
}

export default function Card({ title, value, subtitle, accentColor, icon }: CardProps) {
  return (
    <div
      className={styles.card}
      style={accentColor ? { '--accent-color': accentColor } as React.CSSProperties : undefined}
    >
      <div className={styles.header}>
        <h4 className={styles.title}>{title}</h4>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <p className={styles.value}>{value}</p>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
