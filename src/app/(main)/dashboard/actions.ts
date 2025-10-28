// src/app/(main)/dashboard/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

// This map tells us which column to filter for which role
const roleToColumnMap: { [key: string]: string } = {
  'je': 'je_name',
  'division_head': 'division_name',
  'circle_head': 'circle_name',
  'zone_head': 'zone_name',
};

export async function exportToExcel(works: any[], selectedColumns: string[] = []) {
  try {
    // Validate selected columns
    const allowedColumns = [
      'id','scheme_name','zone_name','circle_name','division_name','sub_division_name','district_name','je_name',
      'work_category','wbs_code','work_name','amount_as_per_bp_lacs','boq_amount','agreement_amount','rate_as_per_ag',
      'tender_no','nit_date','part1_opening_date','loi_no_and_date','part2_opening_date','agreement_no_and_date',
      'firm_name_and_contact','firm_contact_no','firm_email','start_date','scheduled_completion_date','actual_completion_date','weightage','progress_percentage',
      'remark','mb_status','teco_status','fico_status','updated_at','is_blocked','blocker_remark',
      'distribution_zone','distribution_circle','distribution_division','distribution_sub_division',
      'bill_no','bill_amount_with_tax'
    ];

    const colsToSelect = (selectedColumns && selectedColumns.length > 0)
      ? selectedColumns.filter(c => allowedColumns.includes(c))
      : allowedColumns;

    if (colsToSelect.length === 0) {
      return { error: 'No valid columns selected for export.' };
    }
    if (!works || works.length === 0) {
      return { error: "No data available for export." };
    }

    // Create Excel workbook
  // Ensure exported sheet contains all requested headers (even if some rows lack the key)
  const worksheet = XLSX.utils.json_to_sheet(works as any[], { header: colsToSelect });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Works");

    // Write file to buffer and then convert to Base64 string
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const base64Data = buffer.toString("base64");
    
    // Create file name
    const fileName = `Pragati-Works-Export-${new Date().toISOString().split('T')[0]}.xlsx`;

    return { success: { data: base64Data, fileName: fileName } };

  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}
