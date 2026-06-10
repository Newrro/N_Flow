'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Bell, 
  Check, 
  CheckSquare, 
  Zap, 
  Calendar, 
  Info, 
  Trash2, 
  MailOpen,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    let active = true;
    let channel: any;
    
    // Get current user ID and initial data
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      if (active) setUserId(user.id);

      // Fetch initial notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!active) return;

      if (!error && data) {
        setNotifications(data);
      }
      setLoading(false);

      // Subscribe to real-time changes
      channel = supabase
        .channel(`realtime-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setNotifications((prev) => [payload.new as Notification, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications((prev) =>
                prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
            }
          }
        );

      channel.subscribe();
    };

    initNotifications();

    // Click outside to close handler
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      active = false;
      document.removeEventListener('mousedown', handleClickOutside);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
  };

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'meeting':
      case 'briefing':
        return { icon: Zap, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
      case 'task':
        return { icon: CheckSquare, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'leave':
      case 'attendance':
        return { icon: Calendar, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { icon: Info, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] text-[var(--foreground-muted)] transition-all hover:bg-[var(--surface-3)] hover:text-[var(--foreground)]',
          open && 'border-[rgba(99,102,241,0.25)] bg-[var(--brand-primary-dim)] text-[var(--brand-accent)]'
        )}
        style={open ? { boxShadow: '0 0 16px rgba(99,102,241,0.15)' } : {}}
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        
        {/* Unread count badge */}
        {mounted && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] hover:opacity-85 transition-opacity"
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--surface-border)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">Loading telemetry...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--foreground-subtle)]">
                    <MailOpen className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground-muted)]">No operations telemetry</p>
                  <p className="text-[10px] text-[var(--foreground-subtle)] mt-1">You are fully synchronized. No new notifications registered.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const config = getIconConfig(n.type);
                  const Icon = config.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      className={cn(
                        'group flex gap-3 p-3.5 hover:bg-[var(--surface-2)] transition-colors cursor-pointer relative',
                        !n.is_read && 'bg-[var(--brand-primary-dim)]/5'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-xs leading-relaxed text-[var(--foreground)]',
                          !n.is_read ? 'font-bold' : 'font-medium opacity-75'
                        )}>
                          {n.message}
                        </p>
                        
                        <p className="text-[10px] font-bold text-[var(--foreground-subtle)] mt-1.5 uppercase tracking-widest">
                          {mounted ? formatRelativeTime(n.created_at) : '...'}
                        </p>
                      </div>

                      {/* Actions/Status */}
                      <div className="flex flex-col items-end justify-between shrink-0 pl-1 gap-2">
                        {/* Unread indicator */}
                        {!n.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]" />
                        )}
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-[var(--status-danger)] text-[var(--foreground-subtle)] transition-all p-1 rounded hover:bg-[rgba(239,68,68,0.06)]"
                          title="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
