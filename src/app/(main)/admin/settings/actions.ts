// src/app/(main)/admin/settings/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { google } from "googleapis";

// यह फंक्शन डेटाबेस से सभी सेटिंग्स लाता है (अपरिवर्तित)
export async function getSettings(supabase: any) {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw new Error("Could not fetch settings from database.");
  
  return data.reduce((acc: Record<string, string>, setting: {key: string, value: string | null}) => {
    if (setting.key) {
      acc[setting.key] = setting.value || '';
    }
    return acc;
  }, {});
}

// नया एक्शन 1: केवल Cloudflare सेटिंग्स को अपडेट करने के लिए
export async function updateCloudflareSettings(formData: FormData) {
  const { client: supabase } = await createSupabaseServerClient();
  const secretAccessKey = formData.get('cloudflare_secret_access_key') as string;

  const settingsToUpdate = [
    { key: 'cloudflare_account_id', value: formData.get('cloudflare_account_id') as string },
    { key: 'cloudflare_access_key_id', value: formData.get('cloudflare_access_key_id') as string },
    { key: 'cloudflare_r2_bucket_name', value: formData.get('cloudflare_r2_bucket_name') as string },
    { key: 'cloudflare_public_r2_url', value: formData.get('cloudflare_public_r2_url') as string },
  ];
  
  // --- सबसे महत्वपूर्ण बदलाव ---
  // सीक्रेट की को केवल तभी अपडेट करें जब उपयोगकर्ता ने कोई नया मान दर्ज किया हो
  if (secretAccessKey && secretAccessKey.trim() !== '') {
    settingsToUpdate.push({ key: 'cloudflare_secret_access_key', value: secretAccessKey });
  }

  const { error } = await supabase.from("settings").upsert(settingsToUpdate, { onConflict: 'key' });

  if (error) { return { error: `Database Error: ${error.message}` }; }
  
  revalidatePath("/(main)/admin/settings");
  return { success: "Cloudflare settings updated successfully!" };
}

// नया एक्शन 2: केवल Google Sheet सेटिंग्स को अपडेट करने के लिए
export async function updateGoogleSheetSettings(formData: FormData) {
  const { client: supabase } = await createSupabaseServerClient();
  
  const settingsToUpdate = [
    { key: 'google_sheet_id', value: formData.get('google_sheet_id') as string },
    { key: 'google_sheet_name', value: formData.get('google_sheet_name') as string },
    { key: 'google_service_account_credentials', value: formData.get('google_service_account_credentials') as string },
  ];

  const { error } = await supabase.from("settings").upsert(settingsToUpdate, { onConflict: 'key' });

  if (error) { return { error: `Database Error: ${error.message}` }; }
  
  revalidatePath("/(main)/admin/settings");
  return { success: "Google Sheet settings updated successfully!" };
}

// गूगल शीट डेटा को हमारे डेटाबेस कॉलम नामों से मैप करना (अपरिवर्तित)
function mapRowToWork(row: any[], headers: string[]) {
  const headerMap: { [key: string]: string } = {
    'S.N.': 'scheme_sr_no',
    'Sr. No. OF SCEME': 'scheme_sr_no',
    'NAME OF SCHEME': 'scheme_name',
    'NAME OF ZONE': 'zone_name',
    'NAME OF CIRCLE': 'circle_name',
    'NAME OF DIVISION': 'division_name',
    'NAME OF SUB-DIVISION': 'sub_division_name',
    'District Name': 'district_name',
    'JE NAME': 'je_name',
    'Work Category': 'work_category',
    'Name of Work': 'work_name',
    'Amount as per BP (Rs. Lacs)': 'amount_as_per_bp_lacs',
    'Tender No.': 'tender_no',
    'BoQ Amount': 'boq_amount',
    'Date of NIT': 'nit_date',
    'Date of  Part-I Opening': 'part1_opening_date',
    'LoI No. & Date': 'loi_no_and_date',
    'Date of Part-II Opening': 'part2_opening_date',
    'Rate as per Ag. (% above/ below)': 'rate_as_per_ag',
    'Agreement Amount': 'agreement_amount',
    'Agreement No. & Date': 'agreement_no_and_date',
    'Name of firm & Contact No.': 'firm_name_and_contact',
    'Firm Contact No.': 'firm_contact_no',
    'Date of Start (As per Agr./ Actual)': 'start_date',
    'Scheduled Date of Completion': 'scheduled_completion_date',
    'Weightage': 'weightage',
    'Present Progress in %': 'progress_percentage',
    'Remark': 'remark',
    'WBS CODE': 'wbs_code', // यह सही होना चाहिए
    'MB Status': 'mb_status',
    'TECO': 'teco_status',
    'FICO': 'fico_status',
  };

  let workObject: { [key: string]: any } = {};
  headers.forEach((header, index) => {
    const dbColumn = headerMap[header];
    if (dbColumn) {
      let value: any = row[index] || null;
      if (value !== null && typeof value === 'string') {
        value = value.trim();
        if (value === '') value = null;
      }
      if (value !== null) {
        if (['amount_as_per_bp_lacs', 'boq_amount', 'agreement_amount'].includes(dbColumn)) {
          value = parseFloat(String(value).replace(/,/g, '')) || null;
        }
        if (['weightage', 'progress_percentage'].includes(dbColumn)) {
          value = parseInt(String(value).replace('%', ''), 10);
          if (isNaN(value)) value = null;
        }
        if (['nit_date', 'part2_opening_date', 'start_date', 'scheduled_completion_date'].includes(dbColumn)) {
          if (typeof value === 'string' && value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = value.split('/');
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            value = `${year}-${month}-${day}`;
          } else { value = null; }
        }
      }
      workObject[dbColumn] = value;
    }
  });
  return workObject;
}

// syncWithGoogleSheet फंक्शन (अपरिवर्तित)
export async function syncWithGoogleSheet() {
  try {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Authentication required." }; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== 'superadmin') { return { error: "Permission Denied: You must be a superadmin to perform this action." }; }

    const settings = await getSettings(supabase);
    const sheetId = settings.google_sheet_id;
    const sheetName = settings.google_sheet_name;
    if (!sheetName) { throw new Error("Sheet Name is not configured."); }
    const credentials = JSON.parse(settings.google_service_account_credentials);
    if (!sheetId || !credentials) { throw new Error("Google Sheet ID or credentials are not configured."); }

    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: sheetName });
    const rows = response.data.values;
    if (!rows || rows.length < 2) { throw new Error("No data found in the specified sheet."); }

    const headers = rows[0];
    const uniqueIdColumnName = 'Sr. No. OF SCEME';
    const srNoIndex = headers.indexOf(uniqueIdColumnName);
    if (srNoIndex === -1) { throw new Error(`The required column '${uniqueIdColumnName}' was not found.`); }

    const sheetSrNos = new Set(rows.slice(1).map(row => row[srNoIndex]).filter(Boolean));
    const { data: existingWorks, error: fetchError } = await supabase.from('works').select('scheme_sr_no');
    if (fetchError) { throw new Error(`Could not fetch existing works: ${fetchError.message}`); }

    const dbSrNos = new Set(existingWorks.map(work => work.scheme_sr_no));
    const srNosToDelete = [...dbSrNos].filter(srNo => !sheetSrNos.has(srNo));

    if (srNosToDelete.length > 0) {
      const { error: deleteError } = await supabase.from('works').delete().in('scheme_sr_no', srNosToDelete);
      if (deleteError) { throw new Error(`Failed to delete old works: ${deleteError.message}`); }
    }

    const dataToUpsert = rows.slice(1)
        .map(row => mapRowToWork(row, headers))
        .filter(work => work.scheme_sr_no && String(work.scheme_sr_no).trim() !== '');

    if (dataToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('works').upsert(dataToUpsert, { onConflict: 'scheme_sr_no' });
        if (upsertError) { throw new Error(`Supabase Upsert Error: ${upsertError.message}`); }
    }
    
    revalidatePath("/(main)/admin/settings");
    revalidatePath("/dashboard");
    return { success: `Sync complete. Upserted: ${dataToUpsert.length}, Deleted: ${srNosToDelete.length}.` };
  } catch (error: any) {
    console.error("SYNC FAILED:", error);
    return { error: error.message };
  }
}