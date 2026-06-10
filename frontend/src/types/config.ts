export interface AppConfig {
  pf_enabled: boolean;
  esic_enabled: boolean;
  company_name: string;
}

export interface DashboardData {
  total_employees: number;
  active_employees: number;
  total_monthly_ctc: number;
  avg_ctc: number;
  total_pf: number;
  total_esic: number;
  total_pt: number;
  total_tds: number;
  pf_threshold_warning: boolean;
  esic_threshold_warning: boolean;
  recent_changes: Array<{
    emp_id: string;
    name: string;
    change_type: string;
    effective_date: string;
    created_at: string;
  }>;
}
