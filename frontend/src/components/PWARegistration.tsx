'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window as any).workbox === undefined // Avoid conflicts if any workbox wrapper is present
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('N-Flow Service Worker registered successfully with scope:', registration.scope);
        } catch (error) {
          console.error('N-Flow Service Worker registration failed:', error);
        }
      };

      // Register after page load
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  useEffect(() => {
    // 2. Listen for PWA install prompt (supported in Chrome/Android/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If PWA is already installed or is installed during session
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
      console.log('N-Flow PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <AnimatePresence>
      {showInstallBtn && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-1)] p-4 shadow-2xl backdrop-blur-md"
          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
        >
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Install N-Flow</h4>
            <p className="text-[9px] text-[var(--foreground-muted)] max-w-[160px]">
              Add N-Flow to your home screen for a fast, full-screen app experience.
            </p>
          </div>
          
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[var(--brand-primary-hover)] transition-colors shadow-md active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Install
          </button>
          
          <button
            onClick={() => setShowInstallBtn(false)}
            className="rounded p-1 text-[var(--foreground-subtle)] hover:bg-[var(--surface-2)] hover:text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
