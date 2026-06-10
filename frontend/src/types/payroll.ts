export interface PayrollRun {
  run_id: number;
  emp_id: string;
  month: string;
  annual_ctc: number;
  monthly_gross: number;
  pt: number;
  tds: number;
  pf: number;
  esic: number;
  net_pay: number;
  status: 'DRAFT' | 'FINAL';
  pf_applicable: number;
  esic_applicable: number;
  created_at: string | null;
}

export interface PayrollWithEmployee extends PayrollRun {
  name: string;
  designation: string | null;
  pan: string | null;
  bank_account: string | null;
  state: string;
}

export interface PayrollCalculation {
  emp_id: string;
  name: string;
  annual_ctc: number;
  monthly_gross: number;
  pt: number;
  tds: number;
  pf: number;
  esic: number;
  net_pay: number;
  pf_applicable: boolean;
  esic_applicable: boolean;
}

export interface PayrollSummary {
  month: string;
  total_employees: number;
  total_gross: number;
  total_pt: number;
  total_tds: number;
  total_pf: number;
  total_esic: number;
  total_net_pay: number;
  status: 'DRAFT' | 'FINAL';
}
