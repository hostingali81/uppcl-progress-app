// src/app/(main)/admin/settings/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { google } from "googleapis";

// This function fetches all settings from database (unchanged)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// New action 1: To update only Cloudflare settings
export async function updateCloudflareSettings(formData: FormData) {
  const { admin: supabase } = await createSupabaseServerClient();
  const secretAccessKey = formData.get('cloudflare_secret_access_key') as string;

  const settingsToUpdate = [
    { key: 'cloudflare_account_id', value: formData.get('cloudflare_account_id') as string },
    { key: 'cloudflare_access_key_id', value: formData.get('cloudflare_access_key_id') as string },
    { key: 'cloudflare_r2_bucket_name', value: formData.get('cloudflare_r2_bucket_name') as string },
    { key: 'cloudflare_public_r2_url', value: formData.get('cloudflare_public_r2_url') as string },
  ];
  
  // --- Most important change ---
  // Only update the secret key when user has entered a new value
  if (secretAccessKey && secretAccessKey.trim() !== '') {
    settingsToUpdate.push({ key: 'cloudflare_secret_access_key', value: secretAccessKey });
  }

  const { error } = await supabase.from("settings").upsert(settingsToUpdate, { onConflict: 'key' });

  if (error) { return { error: `Database Error: ${error.message}` }; }
  
  revalidatePath("/(main)/admin/settings");
  return { success: "Cloudflare settings updated successfully!" };
}

// New action 2: To update only Google Sheet settings
export async function updateGoogleSheetSettings(formData: FormData) {
  const { admin: supabase } = await createSupabaseServerClient();
  
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

// Mapping Google Sheet data to our database column names (UPDATED FOR NEW SCHEMA)
function mapRowToWork(row: (string | number)[], headers: string[]) {
  const headerMap: { [key: string]: string } = {
    // Basic identification
    'S.N.': 'scheme_sr_no',
    'Sr. No. OF SCEME': 'scheme_sr_no',
    'Scheme Name': 'scheme_name',
    'Name of Work': 'work_name',

    // Civil hierarchy (UPDATED for new schema)
    'Civil Zone': 'civil_zone',
    'Civil Circle': 'civil_circle',
    'Civil Division': 'civil_division',
    'Civil Sub-Division': 'civil_sub_division',

    // Legacy zone mapping (keep for backward compatibility)
    'NAME OF ZONE': 'civil_zone',  // Map old zone to civil_zone
    'NAME OF CIRCLE': 'civil_circle',
    'NAME OF DIVISION': 'civil_division',
    'NAME OF SUB-DIVISION': 'civil_sub_division',

    // Location and personnel
    'District Name': 'district_name',
    'JE Name': 'je_name',
    'JE NAME': 'je_name',
    'Work Category': 'work_category',
    'Site Name': 'site_name',

    // Financial details
    'Sanction Amount (Rs. Lacs)': 'sanction_amount_lacs',
    'Amount as per BP (Rs. Lacs)': 'sanction_amount_lacs',  // Map to sanction_amount_lacs
    'Tender No.': 'tender_no',
    'BoQ Amount': 'boq_amount',
    'Agreement Amount': 'agreement_amount',
    'Bill Amount (Incl. Tax)': 'bill_amount_with_tax',
    'Bill No': 'bill_no',

    // Dates and procurement
    'Date of NIT': 'nit_date',
    'Date of Part-I Opening': 'part1_opening_date',
    'LoI No. & Date': 'loi_no_and_date',
    'Date of Part-II Opening': 'part2_opening_date',
    'Agreement No. & Date': 'agreement_no_and_date',

    // Contractors and rates
    'Rate as per Ag. (% above/ below)': 'rate_as_per_ag',
    'Name of firm & Contact No.': 'firm_name_and_contact',
    'Firm Contact No.': 'firm_contact_no',
    'Firm Email': 'firm_email',

    // Timeline
    'Date of Start (As per Agr./ Actual)': 'start_date',
    'Scheduled Date of Completion': 'scheduled_completion_date',
    'Actual Date of Completion': 'actual_completion_date',
    'Expected Date of Completion': 'expected_completion_date',

    // Progress and status
    'Weightage': 'weightage',
    'Present Progress in %': 'progress_percentage',
    'Remark': 'remark',
    'WBS Code': 'wbs_code',
    'MB Status': 'mb_status',
    'TECO': 'teco_status',
    'FICO': 'fico_status',

    // Distribution hierarchy (matches your Google Sheet)
    'Distribution Zone': 'distribution_zone',
    'Distribution Circle': 'distribution_circle',
    'Distribution Division': 'distribution_division',
    'Distribution Sub-Division': 'distribution_sub_division',
  };

  const workObject: { [key: string]: string | number | null } = {};
  headers.forEach((header, index) => {
    const dbColumn = headerMap[header];
    if (dbColumn) {
      let value: string | number | null = row[index] || null;
      if (value !== null && typeof value === 'string') {
        value = value.trim().replace(/\n/g, ' ');
        if (value === '') value = null;
      }
      if (value !== null) {
        // Handle numeric fields (updated for new schema)
        if (['sanction_amount_lacs', 'amount_as_per_bp_lacs', 'boq_amount', 'agreement_amount', 'bill_amount_with_tax'].includes(dbColumn)) {
          value = parseFloat(String(value).replace(/,/g, '')) || null;
        }
        // Handle percentage fields
        if (['weightage', 'progress_percentage'].includes(dbColumn)) {
          value = parseInt(String(value).replace('%', ''), 10);
          if (isNaN(value)) value = null;
        }
        // Handle date fields with multiple format support
        if (['nit_date', 'part1_opening_date', 'part2_opening_date', 'start_date', 'scheduled_completion_date', 'actual_completion_date', 'expected_completion_date'].includes(dbColumn)) {
          if (typeof value === 'number' && value > 10000) {
            // Handle Excel serial number dates
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            value = date.toISOString().split('T')[0];
          } else if (typeof value === 'string') {
            // Try multiple date formats
            const dateFormats = [
              /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // DD/MM/YYYY
              /^\d{4}-\d{1,2}-\d{1,2}$/,   // YYYY-MM-DD
              /^\d{1,2}-\d{1,2}-\d{4}$/,   // DD-MM-YYYY
              /^\d{1,2}\.\d{1,2}\.\d{4}$/, // DD.MM.YYYY
            ];
            
            let dateProcessed = false;
            for (const format of dateFormats) {
              if (value.match(format)) {
                if (format.source === '^\\d{1,2}\\/\\d{1,2}\\/\\d{4}$') {
                  // DD/MM/YYYY format
                  const parts = value.split('/');
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2];
                  value = `${year}-${month}-${day}`;
                } else if (format.source === '^\\d{1,2}-\\d{1,2}-\\d{4}$') {
                  // DD-MM-YYYY format
                  const parts = value.split('-');
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2];
                  value = `${year}-${month}-${day}`;
                } else if (format.source === '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$') {
                  // DD.MM.YYYY format
                  const parts = value.split('.');
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2];
                  value = `${year}-${month}-${day}`;
                }
                // YYYY-MM-DD format is already correct
                dateProcessed = true;
                break;
              }
            }
            
            if (!dateProcessed) {
              console.warn(`Date format not recognized for ${dbColumn}: "${value}"`);
              value = null;
            }
          } else { 
            value = null; 
          }
        }
      }
      workObject[dbColumn] = value;
    } else {
      console.warn(`No mapping found for header: "${header}"`);
    }
  });
  
  // Add debugging for important fields
  if (workObject.scheme_sr_no) {
    console.log(`Processing work ${workObject.scheme_sr_no}:`, {
      work_name: workObject.work_name,
      progress_percentage: workObject.progress_percentage,
      agreement_amount: workObject.agreement_amount,
      district_name: workObject.district_name
    });
  }
  
  return workObject;
}

// syncWithGoogleSheet function (unchanged)
export async function syncWithGoogleSheet() {
  try {
    const { admin: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { return { error: "Authentication required." }; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as { data: { role: string } | null };
    if (profile?.role !== 'superadmin') { return { error: "Permission Denied: You must be a superadmin to perform this action." }; }

    const settings = await getSettings(supabase);
    const sheetId = settings.google_sheet_id;
    const sheetName = settings.google_sheet_name;
    if (!sheetName) { throw new Error("Sheet Name is not configured."); }
    const credentials = JSON.parse(settings.google_service_account_credentials);
    if (!sheetId || !credentials) { throw new Error("Google Sheet ID or credentials are not configured."); }

    // Create auth client with current timestamp for token
    const auth = new google.auth.GoogleAuth({ 
      credentials: {
        ...credentials,
        // Ensure token is fresh with proper timestamps
        iat: Math.floor(Date.now() / 1000), // Current time in seconds
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      }, 
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    // Get authenticated client
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });
    
    // Make the API request
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
    });
    const rows = response.data.values as (string | number)[][] | undefined;
    if (!rows || rows.length < 2) { throw new Error("No data found in the specified sheet."); }

  const headers = (rows && rows[0] ? (rows[0] as string[]) : []) as string[];
    console.log("Google Sheet Headers:", headers);
    console.log("First few rows:", rows.slice(0, 3));
    
    // Try multiple possible header names for the unique ID column (tolerant to variations)
    const uniqueIdCandidates = [
      'Sr. No. OF SCEME',
      'S.N.',
      'Sr. No.',
      'Sr No',
      'Sr. No. OF SCHEME',
      'Sr. No. of Scheme',
      'Scheme Sr No',
      'Scheme Sr. No',
      'SR NO',
      'SR. NO',
    ];

    let srNoIndex = -1;
    for (const candidate of uniqueIdCandidates) {
      const idx = headers.findIndex((h: string) => String(h).trim().toLowerCase() === candidate.trim().toLowerCase());
      if (idx !== -1) { srNoIndex = idx; break; }
    }

    // If exact matches failed, try fuzzy match: look for header that contains both 'sr' and 'no' or 'scheme'
    if (srNoIndex === -1) {
      srNoIndex = headers.findIndex((h: string | undefined) => {
        if (!h) return false;
        const key = String(h).toLowerCase();
        return (key.includes('sr') && key.includes('no')) || key.includes('scheme');
      });
    }

    if (srNoIndex === -1) {
      console.error('Available headers from sheet:', headers);
      throw new Error(`The required unique ID column (Sr. No.) was not found in the sheet. Expected one of: ${uniqueIdCandidates.join(', ')}.`);
    }

  const sheetRows = (rows || []).slice(1) as (string | number)[][];
  const sheetSrNos = new Set(sheetRows.map((row) => row[srNoIndex]).filter(Boolean));
  const { data: existingWorks, error: fetchError } = await supabase.from('works').select('scheme_sr_no') as any;
    if (fetchError) { throw new Error(`Could not fetch existing works: ${fetchError.message}`); }

  const dbSrNos = new Set((existingWorks || []).map((work: any) => work.scheme_sr_no));
  const srNosToDelete = [...dbSrNos].filter((srNo: any) => !sheetSrNos.has(srNo));

    if (srNosToDelete.length > 0) {
      const { error: deleteError } = await supabase.from('works').delete().in('scheme_sr_no', srNosToDelete);
      if (deleteError) { throw new Error(`Failed to delete old works: ${deleteError.message}`); }
    }

  const dataToUpsert = sheetRows
    .map((row) => mapRowToWork(row as (string | number)[], headers))
    .filter((work: any) => work.scheme_sr_no && String(work.scheme_sr_no).trim() !== '');

    console.log(`Total rows processed: ${rows.length - 1}`);
    console.log(`Valid works to upsert: ${dataToUpsert.length}`);
    console.log("Sample work data:", dataToUpsert.slice(0, 2));

    if (dataToUpsert.length > 0) {
  const { error: upsertError } = await (supabase.from('works') as any).upsert(dataToUpsert, { onConflict: 'scheme_sr_no' });
        if (upsertError) { 
          console.error("Upsert Error Details:", upsertError);
          throw new Error(`Supabase Upsert Error: ${upsertError.message}`); 
        }
    }
    
    revalidatePath("/(main)/admin/settings");
    revalidatePath("/dashboard");
    return { success: `Sync complete. Upserted: ${dataToUpsert.length}, Deleted: ${srNosToDelete.length}.` };
  } catch (error: unknown) {
    console.error("SYNC FAILED:", error);
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}
