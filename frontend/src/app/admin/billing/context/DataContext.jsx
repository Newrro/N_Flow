import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext(null);

// Parties = customers + suppliers/vendors (one unified list)
const SEED_PARTIES = [
  { id: 'v1', name: 'Robocraze Electronics', gstin: '29AABCU9603R1ZM', contact: 'sales@robocraze.com', phone: '+91 80 4567 8901', type: 'supplier', address: 'Bengaluru, KA', createdAt: '2024-01-15' },
  { id: 'v2', name: 'DigiKey India', gstin: '29BBBCD1234X1ZY', contact: 'india@digikey.com', phone: '+91 22 6789 0123', type: 'supplier', address: 'Mumbai, MH', createdAt: '2024-02-01' },
  { id: 'v3', name: 'TechSpark Automation', gstin: '27CCCDE5678Y2ZP', contact: 'info@techspark.in', phone: '+91 20 3456 7890', type: 'customer', address: 'Pune, MH', createdAt: '2024-01-20' },
  { id: 'v4', name: 'Orbit Robotics Labs', gstin: '29DDEFG9012Z3ZK', contact: 'hello@orbitlabs.in', phone: '+91 80 9988 7766', type: 'customer', address: 'Bengaluru, KA', createdAt: '2024-02-10' },
];

// Company sales invoices (money coming in). profitPct is adjustable per invoice.
const SEED_INVOICES = [
  {
    id: 'inv-001', date: '2024-01-10', invoiceNo: 'NEWRRO-2024-001',
    customerId: 'v3', customerName: 'TechSpark Automation',
    type: 'OEM', description: 'AMR Controller Kit - 5 units',
    amount: 125000, profitPct: 50, gstRate: 18, cgst: 11250, sgst: 11250, igst: 0, totalWithGst: 147500,
    status: 'paid', modeOfPayment: 'Net Banking', pdfName: null, pdfData: null, notes: 'First batch delivery', createdAt: '2024-01-10'
  },
  {
    id: 'inv-002', date: '2024-01-18', invoiceNo: 'NEWRRO-2024-002',
    customerId: 'v4', customerName: 'Orbit Robotics Labs',
    type: 'Procurement', description: 'Servo motors & sensors - bulk supply',
    amount: 48000, profitPct: 10, gstRate: 18, cgst: 4320, sgst: 4320, igst: 0, totalWithGst: 56640,
    status: 'paid', modeOfPayment: 'UPI', pdfName: null, pdfData: null, notes: 'Q1 supply', createdAt: '2024-01-18'
  },
  {
    id: 'inv-003', date: '2024-02-05', invoiceNo: 'NEWRRO-2024-003',
    customerId: 'v3', customerName: 'TechSpark Automation',
    type: 'OEM', description: 'Custom AMR System Build',
    amount: 280000, profitPct: 45, gstRate: 18, cgst: 25200, sgst: 25200, igst: 0, totalWithGst: 330400,
    status: 'paid', modeOfPayment: 'Net Banking', pdfName: null, pdfData: null, notes: '', createdAt: '2024-02-05'
  },
  {
    id: 'inv-004', date: '2024-02-14', invoiceNo: 'NEWRRO-2024-004',
    customerId: 'v4', customerName: 'Orbit Robotics Labs',
    type: 'Procurement', description: 'Microcontrollers STM32 - 50 pcs',
    amount: 32000, profitPct: 12, gstRate: 12, cgst: 1920, sgst: 1920, igst: 0, totalWithGst: 35840,
    status: 'paid', modeOfPayment: 'Cheque', pdfName: null, pdfData: null, notes: '', createdAt: '2024-02-14'
  },
  {
    id: 'inv-005', date: '2024-03-01', invoiceNo: 'NEWRRO-2024-005',
    customerId: 'v3', customerName: 'TechSpark Automation',
    type: 'OEM', description: 'AMR Navigation Module x3',
    amount: 95000, profitPct: 50, gstRate: 18, cgst: 8550, sgst: 8550, igst: 0, totalWithGst: 112100,
    status: 'pending', modeOfPayment: 'Net Banking', pdfName: null, pdfData: null, notes: 'Awaiting PO confirmation', createdAt: '2024-03-01'
  },
];

// Expenses = money going out (component purchases, services, etc.)
const SEED_EXPENSES = [
  {
    id: 'exp-001', date: '2024-01-08', vendorId: 'v1', vendorName: 'Robocraze Electronics',
    description: 'Servo motors MG996R x20, jumper wires', category: 'Components',
    amount: 18500, gstRate: 18, gstAmount: 3330, totalWithGst: 21830,
    pdfName: null, pdfData: null, createdAt: '2024-01-08'
  },
  {
    id: 'exp-002', date: '2024-02-02', vendorId: 'v2', vendorName: 'DigiKey India',
    description: 'STM32 dev boards & sensors', category: 'Components',
    amount: 26000, gstRate: 18, gstAmount: 4680, totalWithGst: 30680,
    pdfName: null, pdfData: null, createdAt: '2024-02-02'
  },
];

const DEFAULT_SETTINGS = {
  // adjustable default profit % applied when picking an invoice type
  margins: { OEM: 50, Procurement: 10, Service: 30 },
  company: { name: 'Newrro', gstin: '29NEWRRO0000X1Z9', address: 'Bengaluru, Karnataka, India' },
};

function load(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

export function DataProvider({ children }) {
  const [invoices, setInvoices] = useState(() => load('newrro_invoices', SEED_INVOICES));
  const [parties, setParties] = useState(() => load('newrro_parties', SEED_PARTIES));
  const [expenses, setExpenses] = useState(() => load('newrro_expenses', SEED_EXPENSES));
  const [settings, setSettings] = useState(() => load('newrro_settings', DEFAULT_SETTINGS));

  useEffect(() => { save('newrro_invoices', invoices); }, [invoices]);
  useEffect(() => { save('newrro_parties', parties); }, [parties]);
  useEffect(() => { save('newrro_expenses', expenses); }, [expenses]);
  useEffect(() => { save('newrro_settings', settings); }, [settings]);

  // Invoices
  const addInvoice = (inv) => {
    const newInv = { ...inv, id: `inv-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setInvoices(prev => [newInv, ...prev]);
    return newInv;
  };
  const updateInvoice = (id, updates) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  const deleteInvoice = (id) => setInvoices(prev => prev.filter(i => i.id !== id));

  // Expenses
  const addExpense = (exp) => {
    const newExp = { ...exp, id: `exp-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };
  const updateExpense = (id, updates) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id));

  // Parties (vendors + customers)
  const addParty = (v) => {
    const newV = { ...v, id: `v-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setParties(prev => [newV, ...prev]);
    return newV;
  };
  const updateParty = (id, updates) => setParties(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  const deleteParty = (id) => setParties(prev => prev.filter(v => v.id !== id));

  // Settings
  const updateSettings = (updates) => setSettings(prev => ({ ...prev, ...updates }));
  const updateMargins = (margins) => setSettings(prev => ({ ...prev, margins: { ...prev.margins, ...margins } }));

  return (
    <DataContext.Provider value={{
      invoices, expenses, parties, vendors: parties, settings,
      addInvoice, updateInvoice, deleteInvoice,
      addExpense, updateExpense, deleteExpense,
      addParty, updateParty, deleteParty,
      addVendor: addParty, updateVendor: updateParty, deleteVendor: deleteParty,
      updateSettings, updateMargins,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
