"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during password update.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] opacity-[0.07] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full bg-[var(--brand-secondary)] opacity-[0.05] blur-[100px]" />
        {/* Grid */}
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
        className="relative z-10 w-full max-w-md"
      >
        <div className="overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-1)] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
          <div className="mb-8 text-center">
            {/* Logo mark */}
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(99,102,241,0.3)] bg-[rgba(99,102,241,0.15)] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <span className="text-xl font-black italic text-[var(--brand-accent)]">N</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">
              Set New Password
            </h1>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Enter your new security credentials below.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.08)] p-6 text-[var(--status-success)]">
                <p className="text-sm font-bold">Password Updated Successfully!</p>
                <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                  Redirecting to login portal in 3 seconds...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                  New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    className="dark-input w-full py-3 pl-10 pr-12 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="dark-input w-full py-3 pl-10 pr-12 text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
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
                    Update Password
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
