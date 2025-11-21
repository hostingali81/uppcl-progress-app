// @ts-nocheck
// src/app/(main)/admin/settings/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudflareSettingsDialog } from "@/components/custom/CloudflareSettingsDialog";
import { GoogleSheetSettingsDialog } from "@/components/custom/GoogleSheetSettingsDialog";
import { SyncButton } from "./SyncButton";
import { Settings, Cloud, FileSpreadsheet } from "lucide-react";

export default async function SettingsPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const settings = await getSettings(supabase);

  // --- Updated here ---
  // Now we will only remove the secret key, not the Google credentials
  const clientSafeSettings = { ...settings };
  delete clientSafeSettings.cloudflare_secret_access_key;

  // Google Sheet credentials will now be passed
  const googleSheetSettings = {
    google_sheet_id: settings.google_sheet_id || '',
    google_sheet_name: settings.google_sheet_name || '',
    google_service_account_credentials: settings.google_service_account_credentials || '',
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-600">
            Configure the main external services for the application here.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Cloud className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Cloudflare R2 Settings</CardTitle>
                <CardDescription className="text-slate-600">
                  This enables file uploads (photos, PDFs) in the application.
                  All fields must be filled correctly.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CloudflareSettingsDialog settings={clientSafeSettings} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Google Sheet Settings</CardTitle>
                <CardDescription className="text-slate-600">
                  This allows the application to sync data from Google Sheets and send updates back.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* --- Updated here --- */}
            <GoogleSheetSettingsDialog settings={googleSheetSettings} />
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Sync Data</h3>
              <p className="text-sm text-slate-600 mb-4">
                After saving settings, you can manually sync data from here.
              </p>
              <SyncButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}