// @ts-nocheck
// src/app/(main)/admin/settings/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudflareSettingsDialog } from "@/components/custom/CloudflareSettingsDialog";
import { GoogleSheetSettingsDialog } from "@/components/custom/GoogleSheetSettingsDialog";
import { PWASettingsDialog } from "@/components/custom/PWASettingsDialog";
import { NotificationSettingsDialog } from "@/components/custom/NotificationSettingsDialog";
import { SyncButton } from "./SyncButton";
import { Settings, Cloud, FileSpreadsheet, Smartphone, Bell } from "lucide-react";

export default async function SettingsPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const settings = await getSettings(supabase);

  // Remove secret key for client safety
  const clientSafeSettings = { ...settings };
  delete clientSafeSettings.cloudflare_secret_access_key;

  // Google Sheet settings
  const googleSheetSettings = {
    google_sheet_id: settings.google_sheet_id || '',
    google_sheet_name: settings.google_sheet_name || '',
    google_service_account_credentials: settings.google_service_account_credentials || '',
  };

  // PWA settings
  const pwaSettings = {
    pwa_app_name: settings.pwa_app_name || 'UPPCL Progress Tracker',
    pwa_short_name: settings.pwa_short_name || 'UPPCL',
    pwa_description: settings.pwa_description || 'Track work progress offline and sync when online',
    pwa_theme_color: settings.pwa_theme_color || '#3b82f6',
    pwa_background_color: settings.pwa_background_color || '#ffffff',
  };

  // Parse notification settings safely (role-based)
  let notificationSettings = {};
  try {
    notificationSettings = JSON.parse(settings.notification_preferences || '{}');
  } catch (e) {
    console.error("Error parsing notification preferences:", e);
    notificationSettings = {};
  }

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
        {/* Cloudflare R2 Settings */}
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

        {/* Google Sheet Settings */}
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

        {/* PWA / Android Settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">PWA / Android App Settings</CardTitle>
                <CardDescription className="text-slate-600">
                  Configure app name, colors, and metadata for Progressive Web App and Android builds.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <PWASettingsDialog settings={pwaSettings} />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> After changing PWA settings, rebuild the app with <code className="bg-blue-100 px-1 rounded">npm run build</code> to apply changes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Notification Settings</CardTitle>
                <CardDescription className="text-slate-600">
                  Manage which activities trigger notifications for each role.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <NotificationSettingsDialog
              initialSettings={notificationSettings}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}