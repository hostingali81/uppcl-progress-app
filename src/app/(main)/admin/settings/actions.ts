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
  const { client: supabase } = await createSupabaseServerClient();
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

// Mapping Google Sheet data to our database column names (unchanged)
function mapRowToWork(row: (string | number)[], headers: string[]) {
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
    'Date of Part-I Opening': 'part1_opening_date',
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
    'WBS CODE': 'wbs_code', // This should be correct
    'MB Status': 'mb_status',
    'TECO': 'teco_status',
    'FICO': 'fico_status',
  };

  const workObject: { [key: string]: string | number | null } = {};
  headers.forEach((header, index) => {
    const dbColumn = headerMap[header];
    if (dbColumn) {
      let value: string | number | null = row[index] || null;
      if (value !== null && typeof value === 'string') {
        value = value.trim();
        if (value === '') value = null;
      }
      if (value !== null) {
        // Handle numeric fields
        if (['amount_as_per_bp_lacs', 'boq_amount', 'agreement_amount'].includes(dbColumn)) {
          value = parseFloat(String(value).replace(/,/g, '')) || null;
        }
        // Handle percentage fields
        if (['weightage', 'progress_percentage'].includes(dbColumn)) {
          value = parseInt(String(value).replace('%', ''), 10);
          if (isNaN(value)) value = null;
        }
        // Handle date fields with multiple format support
        if (['nit_date', 'part1_opening_date', 'part2_opening_date', 'start_date', 'scheduled_completion_date'].includes(dbColumn)) {
          if (typeof value === 'string') {
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
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    // Make the API request
    const response = await sheets.spreadsheets.values.get({ 
      spreadsheetId: sheetId, 
      range: sheetName,
      auth: client
    });
    const rows = response.data.values;
    if (!rows || rows.length < 2) { throw new Error("No data found in the specified sheet."); }

    const headers = rows[0];
    console.log("Google Sheet Headers:", headers);
    console.log("First few rows:", rows.slice(0, 3));
    
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

    console.log(`Total rows processed: ${rows.length - 1}`);
    console.log(`Valid works to upsert: ${dataToUpsert.length}`);
    console.log("Sample work data:", dataToUpsert.slice(0, 2));

    if (dataToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('works').upsert(dataToUpsert, { onConflict: 'scheme_sr_no' });
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