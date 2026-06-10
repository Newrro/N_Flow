"use client";

import React, { useState } from "react";
import { Key, Mail, Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { login } from "../auth/actions/login";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (result && 'error' in result) {
        setError(result.error || "Authentication failed. Please verify your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected system error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSuccess(null);
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setResetSuccess("Recovery email dispatched. Check your inbox for the link.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send recovery email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
      style={{ minHeight: '100dvh' }}
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] opacity-[0.07] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full bg-[var(--brand-secondary)] opacity-[0.05] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--surface-border) 1px, transparent 1px), linear-gradient(90deg, var(--surface-border) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-4xl"
      >
        {/* login-grid: two columns on desktop, single column on mobile */}
        <div className="login-grid grid grid-cols-1 overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-1)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] md:grid-cols-2">
          
          {/* Left panel — brand — hidden on mobile */}
          <div className="login-brand-panel relative hidden md:flex flex-col justify-between overflow-hidden p-10 md:p-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.2)] via-[rgba(99,102,241,0.05)] to-transparent" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--brand-accent)] opacity-10 blur-[80px]" />

            <div className="relative z-10">
              <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.15)] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <span className="text-xl font-black italic text-[var(--brand-accent)]">N</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)] md:text-5xl">
                N-FLOW
              </h1>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-[var(--foreground-subtle)]">
                Strategic Resource Interface
              </p>
              <p className="mt-8 max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">
                Modular workspace for operations, risk management, and personnel — structured for clarity, built for scale.
              </p>
            </div>

            <div className="relative z-10 mt-12 flex items-center gap-6 border-t border-[var(--surface-border)] pt-8">
              {[
                { label: "Revision", value: "v2.1.0" },
                { label: "Protocol", value: "Verified" }
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">{s.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--foreground-muted)]">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="login-form-panel flex flex-col justify-center border-l border-[var(--surface-border)] p-6 md:p-10 lg:p-12">
            {/* Mobile-only logo */}
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.15)]">
                <span className="text-lg font-black italic text-[var(--brand-accent)]">N</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-[var(--foreground)]">N-FLOW</h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">Strategic Resource Interface</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {mode === "signin" ? "Sign in" : "Recover Password"}
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {mode === "signin"
                  ? "Enter your credentials to access the platform."
                  : "Enter your email to receive a password reset link."}
              </p>
            </div>

            {mode === "signin" ? (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                    Corporate email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <input
                      required
                      type="email"
                      placeholder="name@organization.com"
                      className="dark-input w-full py-3 pl-10 pr-4 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setError(null); }}
                      className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="dark-input w-full py-3 pl-10 pr-12 text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3.5 text-[var(--status-danger)]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </motion.div>
                )}

                <button
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Access Platform
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={onResetSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                    Corporate email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <input
                      required
                      type="email"
                      placeholder="name@organization.com"
                      className="dark-input w-full py-3 pl-10 pr-4 text-sm"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                {resetSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] p-3.5 text-[var(--status-success)]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-[var(--status-success)]" />
                    <p className="text-xs font-semibold">{resetSuccess}</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3.5 text-[var(--status-danger)]"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send Recovery Link
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(null); setResetSuccess(null); }}
                    className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors py-2 text-center"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 flex items-center gap-2">
              <span className="pulse-dot green" />
              <span className="text-xs text-[var(--foreground-subtle)]">Encrypted session — end-to-end secure</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
