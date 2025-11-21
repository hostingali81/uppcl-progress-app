// src/app/(main)/dashboard/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { pushToGoogleSheet } from "@/app/(main)/admin/settings/actions";
import { cache } from "@/lib/cache";

// This map tells us which column to filter for which role
const roleToColumnMap: { [key: string]: string } = {
  'je': 'je_name',
  'division_head': 'division_name',
  'circle_head': 'circle_name',
  'zone_head': 'zone_name',
};

export async function updateWorkField(workId: number, fieldName: string, value: string) {
  try {
    console.log('=== UPDATE WORK FIELD START ===');
    console.log('Work ID:', workId);
    console.log('Field Name:', fieldName);
    console.log('New Value:', value);

    const { client: supabase, admin: adminSupabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('ERROR: No user authenticated');
      return { error: "Authentication required." };
    }
    
    console.log('User ID:', user.id);

    const allowedFields = [
      'work_name', 'district_name', 'civil_zone', 'civil_circle', 'civil_division', 'civil_sub_division',
      'je_name', 'work_category', 'wbs_code', 'sanction_amount_lacs', 'tender_no', 'boq_amount',
      'nit_date', 'part1_opening_date', 'part2_opening_date', 'loi_no_and_date', 'rate_as_per_ag',
      'agreement_amount', 'agreement_no_and_date', 'firm_name_and_contact', 'firm_contact_no',
      'firm_email', 'start_date', 'scheduled_completion_date', 'actual_completion_date',
      'weightage', 'progress_percentage', 'remark', 'mb_status', 'teco_status', 'fico_status',
      'distribution_zone', 'distribution_circle', 'distribution_division', 'distribution_sub_division'
    ];

    if (!allowedFields.includes(fieldName)) {
      console.log('ERROR: Field not allowed:', fieldName);
      return { error: "Invalid field name." };
    }

    // Get current value before update
    const { data: beforeUpdate } = await adminSupabase
      .from('works')
      .select(`id, ${fieldName}`)
      .eq('id', workId)
      .single();
    
    console.log('Before Update:', beforeUpdate);

    // Use admin client to bypass RLS for updates
    const updateData: any = { [fieldName]: value || null };
    console.log('Update Data:', updateData);
    
    const { data: updateResult, error } = await adminSupabase
      .from('works')
      .update(updateData)
      .eq('id', workId)
      .select();

    if (error) {
      console.error('Update error:', error);
      return { error: error.message };
    }
    
    console.log('Update Result:', updateResult);
    
    // Verify the update
    const { data: afterUpdate } = await adminSupabase
      .from('works')
      .select(`id, ${fieldName}`)
      .eq('id', workId)
      .single();
    
    console.log('After Update:', afterUpdate);
    
    // Clear all relevant caches
    cache.clear();
    console.log('Cache cleared');
    
    // Get the updated work data including scheme_sr_no for Google Sheets sync
    const { data: updatedWork } = await adminSupabase
      .from('works')
      .select('scheme_sr_no')
      .eq('id', workId)
      .single();

    // Sync to Google Sheets if scheme_sr_no exists
    if (updatedWork?.scheme_sr_no) {
      const syncData = {
        scheme_sr_no: updatedWork.scheme_sr_no,
        [fieldName]: value || null
      };
      
      console.log('Syncing to Google Sheets:', syncData);
      
      // Push to Google Sheets (don't block on errors)
      try {
        const syncResult = await pushToGoogleSheet(syncData);
        console.log('Google Sheets sync result:', syncResult);
      } catch (syncError) {
        console.error('Google Sheets sync failed:', syncError);
      }
    }
    
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/work/${workId}`);
    
    console.log('=== UPDATE WORK FIELD END ===');
    return { success: "Updated successfully." };
  } catch (error) {
    console.error('FATAL ERROR in updateWorkField:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

export async function deleteWork(workId: number) {
  const { client: supabase, admin: adminSupabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // Get work data before deletion for Google Sheets sync
  const { data: workToDelete } = await adminSupabase
    .from('works')
    .select('scheme_sr_no')
    .eq('id', workId)
    .single();

  // Use admin client to bypass RLS for deletions
  const { error } = await adminSupabase.from('works').delete().eq('id', workId);
  if (error) {
    console.error('Delete error:', error);
    return { error: error.message };
  }
  
  // Clear all relevant caches
  cache.clear(); // Clear all caches to ensure fresh data
  
  // Note: For deletions, you may want to manually delete from Google Sheets
  // or run a full sync. Automatic deletion from sheets is risky.
  // For now, we'll just log it.
  if (workToDelete?.scheme_sr_no) {
    console.log(`Work ${workToDelete.scheme_sr_no} deleted from database. Consider syncing Google Sheets.`);
  }
  
  revalidatePath('/dashboard');
  return { success: "Work deleted successfully. Note: Please sync Google Sheets to reflect this deletion." };
}

export async function exportToExcel(works: any[], selectedColumns: string[] = []) {
  try {
    const columnMapping: { [key: string]: string } = {
      'id': 'ID',
      'scheme_name': 'Scheme Name',
      'civil_zone': 'Civil Zone',
      'civil_circle': 'Civil Circle',
      'civil_division': 'Civil Division',
      'civil_sub_division': 'Civil Sub-Division',
      'district_name': 'District Name',
      'je_name': 'JE Name',
      'work_category': 'Work Category',
      'wbs_code': 'WBS Code',
      'work_name': 'Name of Work',
      'amount_as_per_bp_lacs': 'Amount as per BP (Rs. Lacs)',
      'boq_amount': 'BoQ Amount',
      'agreement_amount': 'Agreement Amount',
      'rate_as_per_ag': 'Rate as per Ag. (% above/ below)',
      'tender_no': 'Tender No.',
      'nit_date': 'Date of NIT',
      'part1_opening_date': 'Date of Part-I Opening',
      'loi_no_and_date': 'LoI No. & Date',
      'part2_opening_date': 'Date of Part-II Opening',
      'agreement_no_and_date': 'Agreement No. & Date',
      'firm_name_and_contact': 'Name of firm & Contact No.',
      'firm_contact_no': 'Firm Contact No.',
      'firm_email': 'Firm Email',
      'start_date': 'Date of Start (As per Agr./ Actual)',
      'scheduled_completion_date': 'Scheduled Date of Completion',
      'actual_completion_date': 'Actual Date of Completion',
      'weightage': 'Weightage',
      'progress_percentage': 'Present Progress in %',
      'remark': 'Remark',
      'mb_status': 'MB Status',
      'teco_status': 'TECO',
      'fico_status': 'FICO',
      'updated_at': 'Updated At',
      'is_blocked': 'Is Blocked',
      'blocker_remark': 'Blocker Remark',
      'distribution_zone': 'Distribution Zone',
      'distribution_circle': 'Distribution Circle',
      'distribution_division': 'Distribution Division',
      'distribution_sub_division': 'Distribution Sub-Division',
      'bill_no': 'Bill No',
      'bill_amount_with_tax': 'Bill Amount (Incl. Tax)'
    };

    const allowedColumns = Object.keys(columnMapping);

    const colsToSelect = (selectedColumns && selectedColumns.length > 0)
      ? selectedColumns.filter(c => allowedColumns.includes(c))
      : allowedColumns;

    if (colsToSelect.length === 0) {
      return { error: 'No valid columns selected for export.' };
    }
    if (!works || works.length === 0) {
      return { error: "No data available for export." };
    }

    // Map data with proper headers
    const mappedData = works.map(work => {
      const mapped: any = {};
      colsToSelect.forEach(col => {
        mapped[columnMapping[col]] = work[col];
      });
      return mapped;
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
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
