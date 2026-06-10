"use client";

import React, { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import LogSubmissionForm from "@/components/employee/LogSubmissionForm";
import { Camera, FileCheck, History } from "lucide-react";

export default function EmployeeLogsPage() {
  return (
    <Container
      title="Submit Work Log"
      subtitle="Upload evidence and narrative — same encryption as the dashboard terminal."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 md:gap-5">
        {/* Sidebar info */}
        <div className="dark-card brand-card p-6 lg:col-span-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.08)] text-[var(--brand-primary)]">
            <History className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-[var(--foreground)]">Logging protocol</h3>
          <ul className="mt-4 space-y-3 text-sm text-[var(--foreground-muted)]">
            <li className="flex gap-2.5">
              <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
              Tie each log to an assigned task when possible.
            </li>
            <li className="flex gap-2.5">
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
              Proof files are hashed and stored securely.
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="dark-card overflow-hidden lg:col-span-8">
          <div className="border-b border-[var(--surface-border)] bg-[var(--surface-2)] px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-subtle)]">Submission form</p>
            <p className="text-sm text-[var(--foreground-muted)]">Complete all required fields before commit.</p>
          </div>
          <div className="p-6 md:p-8">
            <Suspense fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-[var(--surface-3)] rounded" />
                <div className="h-10 bg-[var(--surface-3)] rounded" />
                <div className="h-24 bg-[var(--surface-3)] rounded" />
              </div>
            }>
              <LogSubmissionForm />
            </Suspense>
          </div>
        </div>
      </div>
    </Container>
  );
}