// src/components/custom/CloudflareSettingsDialog.tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCloudflareSettings } from "@/app/(main)/admin/settings/actions";

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
      // --- यहाँ बदलाव किया गया है ---
      setMessage(result.error || result.success || null);
      if (result.success) {
        setTimeout(() => setIsOpen(false), 1500);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Cloudflare R2 सेटिंग्स अपडेट करें</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cloudflare R2 सेटिंग्स</DialogTitle>
          <DialogDescription>फाइल स्टोरेज के लिए Cloudflare R2 की API Keys. सीक्रेट की केवल तभी बदलें जब आवश्यक हो।</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2"> <Label htmlFor="cloudflare_account_id">Account ID</Label> <Input id="cloudflare_account_id" name="cloudflare_account_id" defaultValue={settings.cloudflare_account_id} /> </div>
          <div className="space-y-2"> <Label htmlFor="cloudflare_access_key_id">Access Key ID</Label> <Input id="cloudflare_access_key_id" name="cloudflare_access_key_id" defaultValue={settings.cloudflare_access_key_id} /> </div>
          <div className="space-y-2"> <Label htmlFor="cloudflare_secret_access_key">Secret Access Key (खाली छोड़ दें यदि बदलना नहीं है)</Label> <Input id="cloudflare_secret_access_key" name="cloudflare_secret_access_key" type="password" /> </div>
          <div className="space-y-2"> <Label htmlFor="cloudflare_r2_bucket_name">R2 Bucket Name</Label> <Input id="cloudflare_r2_bucket_name" name="cloudflare_r2_bucket_name" defaultValue={settings.cloudflare_r2_bucket_name} /> </div>
          <div className="space-y-2"> <Label htmlFor="cloudflare_public_r2_url">Public R2 URL</Label> <Input id="cloudflare_public_r2_url" name="cloudflare_public_r2_url" defaultValue={settings.cloudflare_public_r2_url} /> </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending}>{isPending ? "सेव हो रहा है..." : "सेटिंग्स सेव करें"}</Button>
          </DialogFooter>
          {message && <p className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}