export type EmployeeType = 'EM' | 'IN' | 'DR' | 'VL';
export type TaxRegime = 'NEW' | 'OLD';

export interface Employee {
  emp_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  pan: string;
  bank_account: string;
  ifsc: string;
  state: string;
  date_of_joining: string;
  annual_ctc: number;
  monthly_gross: number;
  tax_regime: TaxRegime;
  role: string | null;
  designation: string | null;
  department: string | null;
  address: string | null;
  manager_name: string | null;
  roles_responsibilities: string | null;
  employee_type: EmployeeType;
  end_date: string | null;
  no_ctc: boolean;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  pan: string;
  bank_account: string;
  ifsc: string;
  state: string;
  date_of_joining: string;
  annual_ctc: string;
  tax_regime: TaxRegime;
  role: string;
  designation: string;
  department: string;
  address: string;
  manager_name: string;
  roles_responsibilities: string;
  employee_type: EmployeeType;
  end_date: string;
  no_ctc: boolean;
}

export type ChangeType = 'PROMOTION' | 'DEMOTION' | 'INCREMENT' | 'DECREMENT' | 'INITIAL';

export interface SalaryHistory {
  history_id: number;
  emp_id: string;
  change_type: ChangeType;
  old_salary: number | null;
  new_salary: number | null;
  old_designation: string | null;
  new_designation: string | null;
  old_role: string | null;
  new_role: string | null;
  reason: string | null;
  effective_date: string | null;
  created_by: string | null;
  created_at: string | null;
}

export const EMPLOYEE_TYPES: Record<EmployeeType, string> = {
  EM: 'Employee',
  IN: 'Intern',
  DR: 'Director',
  VL: 'Volunteer',
};

export type PendingCandidateStatus = 'pending' | 'accepted' | 'rejected';

export interface PendingCandidate {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  position: string;
  department?: string | null;
  joining_date: string;
  annual_ctc: number;
  reporting_to?: string | null;
  responsibilities?: string | null;
  employee_type: EmployeeType;
  created_at?: string | null;
  status: PendingCandidateStatus;
  // Additional fields to be filled when accepting
  pan?: string | null;
  bank_account?: string | null;
  ifsc?: string | null;
  state?: string | null;
  date_of_joining?: string;
  role?: string | null;
  designation?: string | null;
  manager_name?: string | null;
  roles_responsibilities?: string | null;
  no_ctc?: boolean;
}

export interface PendingCandidateFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  joining_date: string;
  annual_ctc: string;
  reporting_to: string;
  responsibilities: string;
  employee_type: EmployeeType;
}

export const STATES = [
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Delhi',
  'Gujarat',
  'West Bengal',
  'Andhra Pradesh',
  'Telangana',
  'Rajasthan',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Kerala',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Jharkhand',
  'Chhattisgarh',
  'Assam',
  'Goa',
];

