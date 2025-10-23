// src/components/custom/CloudflareSettingsDialog.tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCloudflareSettings } from "@/app/(main)/admin/settings/actions";
import { Cloud, Save } from "lucide-react";

type Settings = Record<string, string>;

export function CloudflareSettingsDialog({ settings }: { settings: Settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateCloudflareSettings(formData);
      // --- Updated here ---
      setMessage(result.error || result.success || null);
      if (result.success) {
        setTimeout(() => setIsOpen(false), 1500);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Cloud className="h-4 w-4 mr-2" />
          Update Cloudflare R2 Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">Cloudflare R2 Settings</DialogTitle>
          <DialogDescription className="text-slate-600">
            API Keys for Cloudflare R2 file storage. Only change the secret key when necessary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="cloudflare_account_id" className="text-sm font-medium text-slate-700">Account ID</Label>
            <Input 
              id="cloudflare_account_id" 
              name="cloudflare_account_id" 
              defaultValue={settings.cloudflare_account_id} 
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloudflare_access_key_id" className="text-sm font-medium text-slate-700">Access Key ID</Label>
            <Input 
              id="cloudflare_access_key_id" 
              name="cloudflare_access_key_id" 
              defaultValue={settings.cloudflare_access_key_id} 
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloudflare_secret_access_key" className="text-sm font-medium text-slate-700">Secret Access Key (leave empty if not changing)</Label>
            <Input 
              id="cloudflare_secret_access_key" 
              name="cloudflare_secret_access_key" 
              type="password" 
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloudflare_r2_bucket_name" className="text-sm font-medium text-slate-700">R2 Bucket Name</Label>
            <Input 
              id="cloudflare_r2_bucket_name" 
              name="cloudflare_r2_bucket_name" 
              defaultValue={settings.cloudflare_r2_bucket_name} 
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cloudflare_public_r2_url" className="text-sm font-medium text-slate-700">Public R2 URL</Label>
            <Input 
              id="cloudflare_public_r2_url" 
              name="cloudflare_public_r2_url" 
              defaultValue={settings.cloudflare_public_r2_url} 
              className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
          {message && (
            <div className={`mt-2 text-sm p-3 rounded-lg border ${
              message.includes('successfully') 
                ? 'text-green-700 bg-green-50 border-green-200' 
                : 'text-red-700 bg-red-50 border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}