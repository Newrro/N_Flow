'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { logout } from '@/app/auth/actions/logout';
import styles from './layout.module.css';
import { Providers } from '@/components/Providers';

const NAV_ITEMS = [
  { href: '/admin/hr/dashboard', icon: '\u2302', label: 'Dashboard' },
  { href: '/admin/hr/employees', icon: '\u2639', label: 'Employees' },
  { href: '/admin/hr/payroll', icon: '\u2261', label: 'Payroll' },
  { href: '/admin/hr/offer-letter', icon: '\u2709', label: 'Offer Letters' },
  { href: '/admin/hr/settings', icon: '\u2699', label: 'Settings' },
];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminInitials, setAdminInitials] = useState('AD');
  const [showModal, setShowModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        if (profile?.name) {
          setAdminName(profile.name);
          const initials = profile.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          setAdminInitials(initials || 'AD');
        } else if (user.email) {
          setAdminName(user.email);
          setAdminInitials(user.email.substring(0, 2).toUpperCase());
        }
      }
    }
    loadUser();
  }, []);

  const currentPage = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const pageTitle = currentPage?.label || 'Dashboard';

  async function handleLogout() {
    await logout();
  }

  return (
    <Providers>
      <div className={styles.wrapper}>
        {/* Overlay for mobile */}
        <div
          className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/NR_HR.png"
              alt="Newrro Payroll"
              className={styles.logoImage}
            />
            <p className={styles.logoSubtitle}>NEWRRO TECH LLP</p>
          </div>
          <p>&emsp;New Revolution in Robotics</p>
          

          <nav className={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  pathname.startsWith(item.href) ? styles.navItemActive : ''
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin/choose"
              className={styles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{'\u21C4'}</span>
              Switch Portal
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <span className={styles.navIcon}>{'\u2192'}</span>
              Sign Out
            </button>
            
            {/* Spacer to shift Sign Out one icon up */}
            <div style={{ height: '40px' }} />
          </div>
        </aside>

        {/* Main content */}
        <div className={styles.main}>
          <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button
                className={styles.hamburger}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                {sidebarOpen ? '\u2715' : '\u2630'}
              </button>
              <h1 className={styles.headerTitle}>{pageTitle}</h1>
            </div>
            <div className={styles.headerRight}>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left focus:outline-none bg-none border-none cursor-pointer p-0"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                title="Change Account Password"
              >
                <div className={styles.userBadge}>
                  <div className={styles.userAvatar}>{adminInitials}</div>
                  <span>{adminName}</span>
                </div>
              </button>
            </div>
          </header>

          <main className={styles.content}>{children}</main>
        </div>

        {/* Change Password Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-1)] p-6 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-2">Change Account Password</h3>
              <p className="text-xs text-[var(--foreground-muted)] mb-5">
                Enter your new password below. Ensure it is at least 6 characters.
              </p>

              {success ? (
                <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] p-4 text-[var(--status-success)] text-xs font-bold text-center">
                  Password updated successfully!
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-semibold text-[var(--status-danger)]">{error}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setError(null); }}
                      className="rounded-lg px-4 py-2 text-xs font-bold text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Save Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Providers>
  );
}
