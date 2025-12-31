export interface Work {
  id: number | string;
  scheme_sr_no?: string | null;
  scheme_name?: string | null;
  work_name?: string | null;
  work_category?: string | null;
  wbs_code?: string | null;
  civil_zone?: string | null;
  civil_circle?: string | null;
  civil_division?: string | null;
  civil_sub_division?: string | null;
  zone_name?: string | null;
  circle_name?: string | null;
  division_name?: string | null;
  district_name?: string | null;
  sub_division_name?: string | null;
  distribution_zone?: string | null;
  distribution_circle?: string | null;
  distribution_division?: string | null;
  distribution_sub_division?: string | null;
  je_name?: string | null;
  site_name?: string | null;
  sanction_amount_lacs?: number | null;
  amount_as_per_bp_lacs?: number | null;
  tender_no?: string | null;
  boq_amount?: number | null;
  nit_date?: string | null;
  part1_opening_date?: string | null;
  part2_opening_date?: string | null;
  loi_no_and_date?: string | null;
  rate_as_per_ag?: number | null;
  agreement_amount?: number | null;
  agreement_no_and_date?: string | null;
  firm_name_and_contact?: string | null;
  firm_contact_no?: string | null;
  firm_email?: string | null;
  start_date?: string | null;
  scheduled_completion_date?: string | null;
  weightage?: number | null;
  progress_percentage?: number | null;
  remark?: string | null;
  mb_status?: string | null;
  teco?: string | null;
  teco_status?: string | null;
  fico?: string | null;
  fico_status?: string | null;
  bill_no?: string | null;
  bill_amount_with_tax?: number | null;
  is_blocked?: boolean;
  blocker_remark?: string | null;
  attachments?: any[];
  comments?: any[];
  created_at?: string;
  actual_completion_date?: string | null;
}

export interface PaymentLog {
  id: number;
  work_id: number;
  user_id: string;
  user_email: string;
  previous_bill_no?: string | null;
  previous_bill_amount?: number | null;
  new_bill_no?: string | null;
  new_bill_amount?: number | null;
  remark?: string | null;
  created_at: string;
}

export interface Attachment {
  id: number;
  file_url: string;
  file_name: string;
  uploader_id: string;
  uploader_full_name: string | null;
  created_at: string;
  work_id: number;
}

export interface ProgressLog {
  id: number;
  work_id: number;
  user_id: string;
  user_email: string | null;
  previous_progress: number | null;
  new_progress: number;
  remark: string | null;
  created_at: string;
  attachments?: Attachment[];
  profiles?: {
    full_name: string | null;
  } | null;
}

export interface WorkActivity {
  id: number;
  work_id: number;
  activity_code: string;
  activity_name: string;
  parent_activity_id: number | null;
  is_main_activity: boolean;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  progress_percentage: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}
