// src/app/(main)/admin/settings/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSettings } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudflareSettingsDialog } from "@/components/custom/CloudflareSettingsDialog";
import { GoogleSheetSettingsDialog } from "@/components/custom/GoogleSheetSettingsDialog";
import { SyncButton } from "./SyncButton";

export default async function SettingsPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const settings = await getSettings(supabase);

  // --- यहाँ बदलाव किया गया है ---
  // अब हम केवल सीक्रेट की को हटाएंगे, गूगल क्रेडेंशियल्स को नहीं
  const clientSafeSettings = { ...settings };
  delete clientSafeSettings.cloudflare_secret_access_key;

  // Google Sheet क्रेडेंशियल्स को अब पास किया जाएगा
  const googleSheetSettings = {
    google_sheet_id: settings.google_sheet_id || '',
    google_sheet_name: settings.google_sheet_name || '',
    google_service_account_credentials: settings.google_service_account_credentials || '',
  };
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">सिस्टम सेटिंग्स</h1>
        <p className="text-gray-500">
          यहाँ से एप्लिकेशन की मुख्य बाहरी सेवाओं को कॉन्फ़िगर करें।
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cloudflare R2 सेटिंग्स</CardTitle>
            <CardDescription>
              यह एप्लिकेशन में फाइल अपलोड (तस्वीरें, PDF) को सक्षम बनाता है।
              सभी फ़ील्ड्स को सही ढंग से भरना आवश्यक है।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloudflareSettingsDialog settings={clientSafeSettings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Sheet सेटिंग्स</CardTitle>
            <CardDescription>
              यह एप्लिकेशन को Google Sheet से डेटा सिंक करने और वापस अपडेट भेजने की अनुमति देता है।
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* --- यहाँ बदलाव किया गया है --- */}
            <GoogleSheetSettingsDialog settings={googleSheetSettings} />
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">डेटा सिंक करें</h3>
              <p className="text-sm text-gray-500 mb-4">
                सेटिंग्स सेव करने के बाद, आप यहाँ से डेटा को मैन्युअल रूप से सिंक कर सकते हैं।
              </p>
              <SyncButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}