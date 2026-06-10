'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/context/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
