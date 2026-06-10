"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, CreditCard, ChevronRight, Terminal, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminChoosePage() {
  const router = useRouter();

  const portals = [
    {
      id: "nflow",
      name: "N_Flow Operations",
      subtitle: "Workforce & Tasks Suite",
      description: "Manage project categories, assign active deliverables, authorize employee access rights, audit logs, and review workforce attendance.",
      icon: ShieldCheck,
      href: "/admin/dashboard",
      glowColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "rgba(99, 102, 241, 0.25)",
      badge: "ACTIVE OPS",
    },
    {
      id: "billing",
      name: "Newrro-Billing",
      subtitle: "Enterprise Finance Portal",
      description: "Generate client sales invoices, monitor supplier payments, track business expenditures, analyze profit & loss ratios, and export financial sheets.",
      icon: CreditCard,
      href: "/admin/billing",
      glowColor: "rgba(167, 139, 250, 0.15)",
      borderColor: "rgba(167, 139, 250, 0.25)",
      badge: "FINANCE HUB",
    },
    {
      id: "hr",
      name: "Newrro HR & Payroll",
      subtitle: "Human Resources Portal",
      description: "Manage employee directories, execute salary disbursements, adjust increments, review candidate contracts, and generate official offer letters.",
      icon: Users,
      href: "/admin/hr/dashboard",
      glowColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "rgba(16, 185, 129, 0.25)",
      badge: "HR TELEMETRY",
    },
    {
      id: "employee",
      name: "My Personal Workspace",
      subtitle: "Employee Portal View",
      description: "Check in/out for daily shifts, submit proof logs for assigned deliverables, request leaves, and review your operational tasks.",
      icon: Terminal,
      href: "/employee/dashboard",
      glowColor: "rgba(244, 63, 94, 0.15)",
      borderColor: "rgba(244, 63, 94, 0.25)",
      badge: "MY PORTAL",
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050208] p-6 text-[#f3effb]">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] opacity-[0.04] blur-[150px]" />
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600 opacity-[0.03] blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-emerald-600 opacity-[0.02] blur-[120px]" />
        
        {/* Dynamic mesh grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--surface-border) 1px, transparent 1px), linear-gradient(90deg, var(--surface-border) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          {/* Logo Badge */}
          <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(167,139,250,0.3)] bg-gradient-to-b from-[rgba(167,139,250,0.15)] to-transparent shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <Terminal className="h-5 w-5 text-indigo-400" />
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Control Panel Routing
          </h1>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--foreground-subtle)]">
            System Synchronizer — Select Portal
          </p>
        </motion.div>

        {/* Portals Selector Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {portals.map((portal, index) => {
            const Icon = portal.icon;
            return (
              <motion.div
                key={portal.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => router.push(portal.href)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-b from-[rgba(15,10,26,0.85)] to-[rgba(11,7,18,0.95)] p-8 transition-all backdrop-blur-md"
                style={{
                  borderColor: portal.borderColor,
                  boxShadow: `0 4px 30px rgba(0,0,0,0.4), 0 0 40px ${portal.glowColor} inset`,
                }}
              >
                {/* Visual hover sheen effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${portal.glowColor} 0%, transparent 70%)`
                  }}
                />

                {/* Card Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="rounded-xl bg-white/5 p-3 text-white border border-white/10 group-hover:border-white/20 transition-all">
                    <Icon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-white/5 bg-white/5 text-[var(--foreground-muted)]">
                    {portal.badge}
                  </span>
                </div>

                {/* Copy */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">
                    {portal.subtitle}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white group-hover:text-indigo-200 transition-colors">
                    {portal.name}
                  </h3>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-muted)] group-hover:text-[var(--foreground-secondary)] transition-colors">
                    {portal.description}
                  </p>
                </div>

                {/* Arrow CTA */}
                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>Open Portal</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center text-[10px] font-medium text-[var(--foreground-subtle)] flex items-center justify-center gap-2"
        >
          <span className="pulse-dot green" />
          <span>Active Administrative Session — Encrypted Sync Node</span>
        </motion.div>
      </div>
    </div>
  );
}
