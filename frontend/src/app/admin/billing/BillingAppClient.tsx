"use client";

import React, { useState, useMemo } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Vendors from "./pages/Vendors";
import ProfitLoss from "./pages/ProfitLoss";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { getYears, filterByYear, exportInvoices, exportExpenses, exportAll } from "./utils/helpers";

import "./newrro-billing.css";

function BillingAppInner() {
  const { user } = useAuth() as any;
  const { invoices, expenses } = useData() as any;
  const [page, setPage] = useState('dashboard');
  const [year, setYear] = useState('all');
  const [searchQ, setSearchQ] = useState('');

  const years = useMemo(
    () => getYears([...invoices, ...expenses]),
    [invoices, expenses]
  );

  const invForYear = filterByYear(invoices, year);
  const expForYear = filterByYear(expenses, year);

  let onExport = null;
  let exportLabel = 'Export Excel';
  if (page === 'invoices') {
    onExport = () => exportInvoices(invForYear, expForYear, year);
  } else if (page === 'expenses') {
    onExport = () => exportExpenses(expForYear, year);
  } else if (page === 'pnl') {
    onExport = () => exportAll(invForYear, expForYear, year);
    exportLabel = 'Export All';
  }

  const showSearch = ['invoices', 'expenses', 'vendors', 'pnl'].includes(page);

  return (
    <div className="newrro-billing-theme w-full h-full flex flex-col">
      <div className="app-layout flex-1">
        <Sidebar active={page} onChange={(p: any) => { setPage(p); setSearchQ(''); }} />
        <div className="main-content flex-1 flex flex-col overflow-hidden">
          <Topbar
            page={page}
            year={year}
            setYear={setYear}
            years={years}
            onExport={onExport}
            exportLabel={exportLabel}
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            showSearch={showSearch}
          />
          <div key={page} className={`view-enter view-${page} page-body`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {page === 'dashboard' && <Dashboard year={year} />}
            {page === 'invoices' && <Invoices year={year} searchQ={searchQ} />}
            {page === 'expenses' && <Expenses year={year} searchQ={searchQ} />}
            {page === 'vendors' && <Vendors year={year} searchQ={searchQ} />}
            {page === 'pnl' && <ProfitLoss year={year} searchQ={searchQ} />}
            {page === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BillingAppClientProps {
  defaultUser: {
    name: string;
    role: string;
    email: string;
  };
}

export default function BillingAppClient({ defaultUser }: BillingAppClientProps) {
  return (
    <AuthProvider defaultUser={defaultUser}>
      <DataProvider>
        <BillingAppInner />
      </DataProvider>
    </AuthProvider>
  );
}
