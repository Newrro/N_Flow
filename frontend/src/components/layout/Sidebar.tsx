'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  ClipboardList,
  LogOut,
  Clock,
  Calendar,
  History,
  Video,
  Folder,
  CreditCard,
  UserCheck,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/auth/actions/logout';

interface SidebarProps {
  role: 'admin' | 'employee';
}

const adminLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Briefings', href: '/admin/meetings', icon: Video },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
  { name: 'Personnel', href: '/admin/users', icon: UserCheck },
  { name: 'Logs', href: '/admin/logs', icon: ClipboardList },
  { name: 'Documents', href: '/admin/documents', icon: Folder },
  { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
  { name: 'Leaves', href: '/admin/leaves', icon: ClipboardList },
];

const adminBottomLinks = [
  { name: 'Billing', href: '/admin/billing', icon: CreditCard },
  { name: 'HR & Payroll', href: '/admin/hr/dashboard', icon: Users },
];

const employeeLinks = [
  { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', href: '/employee/tasks', icon: Clock },
  { name: 'Submit Log', href: '/employee/logs', icon: History },
  { name: 'Documents', href: '/employee/documents', icon: Folder },
  { name: 'Attendance', href: '/employee/attendance', icon: Calendar },
  { name: 'Leave', href: '/employee/leaves', icon: ClipboardList },
];

const Sidebar = ({ role }: SidebarProps) => {
  const pathname = usePathname();
  const isEmployeeRoute = pathname.startsWith('/employee');

  let links = isEmployeeRoute ? [...employeeLinks] : [...adminLinks];
  if (role === 'admin' && isEmployeeRoute) {
    links.push({ name: 'Switch', href: '/admin/choose', icon: RefreshCw });
  }

  const router = useRouter();
  const [isInsideMobileApp, setIsInsideMobileApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsInsideMobileApp(!!(window as any).Capacitor);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // ─── MOBILE BOTTOM NAV ───────────────────────────────────────────────────────
  if (isMobile) {
    // On mobile show a limited set — max 5 icons to fit screen
    const mobileLinks = links.slice(0, 5);

    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--surface-border)] bg-[var(--surface-1)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          height: 'calc(64px + env(safe-area-inset-bottom))',
        }}
      >
        {mobileLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
                isActive
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--foreground-subtle)]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                {link.name}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[var(--brand-primary)]"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
            </Link>
          );
        })}

        {/* Logout button in mobile nav */}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[var(--foreground-subtle)] transition-colors hover:text-[var(--status-danger)]"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Out</span>
        </button>
      </nav>
    );
  }

  // ─── DESKTOP SIDE NAV ─────────────────────────────────────────────────────────
  return (
    <aside className="relative flex w-[60px] shrink-0 flex-col items-center border-r border-[var(--surface-border)] bg-[var(--surface-1)] py-5"
      style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}
    >
      <div className="mb-4" />

      <nav className="flex flex-col items-center gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-[var(--brand-primary-dim)] text-[var(--brand-primary)]'
                  : 'text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground-muted)]'
              )}
              style={isActive ? { boxShadow: '0 0 12px rgba(99,102,241,0.2)' } : {}}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg border border-[rgba(99,102,241,0.25)] bg-[var(--brand-primary-dim)]"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[var(--surface-border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
                {link.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center shrink-0 gap-4">
        <div className="w-8 border-t border-[var(--surface-border)]" />

        {role === 'admin' && !isEmployeeRoute && (
          <div className="flex flex-col items-center gap-1">
            {adminBottomLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-[var(--brand-primary-dim)] text-[var(--brand-primary)]'
                      : 'text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground-muted)]'
                  )}
                  style={isActive ? { boxShadow: '0 0 12px rgba(99,102,241,0.2)' } : {}}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bottom"
                      className="absolute inset-0 rounded-lg border border-[rgba(99,102,241,0.25)] bg-[var(--brand-primary-dim)]"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[var(--surface-border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
                    {link.name}
                  </div>
                </Link>
              );
            })}
            <div className="w-8 border-t border-[var(--surface-border)] mt-2" />
          </div>
        )}

        {!isInsideMobileApp && (
          <a
            href="/app-release.apk"
            download
            className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground-subtle)] transition-all hover:bg-[var(--surface-2)] hover:text-white"
          >
            <Smartphone className="h-4 w-4" />
            <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[var(--surface-border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--foreground)] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
              Download Android App
            </div>
          </a>
        )}

        <button
          onClick={handleLogout}
          className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground-subtle)] transition-all hover:bg-[rgba(239,68,68,0.08)] hover:text-[var(--status-danger)]"
        >
          <LogOut className="h-4 w-4" />
          <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--status-danger)] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 z-50">
            Logout
          </div>
        </button>

        <div className="h-10 w-10" />
      </div>
    </aside>
  );
};

export default Sidebar;
