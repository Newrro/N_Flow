'use client';

import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, style, className }: BadgeProps) {
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${className || ''}`}
      style={style}
    >
      {children}
    </span>
  );
}
