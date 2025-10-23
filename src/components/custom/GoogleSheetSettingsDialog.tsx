// src/components/custom/GoogleSheetSettingsDialog.tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateGoogleSheetSettings } from "@/app/(main)/admin/settings/actions";

type Settings = Record<string, string>;

export function GoogleSheetSettingsDialog({ settings }: { settings: Settings }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateGoogleSheetSettings(formData);
            setMessage(result.error || result.success || null);
            if (result.success) {
                setTimeout(() => setIsOpen(false), 1500);
            }
        });
    };

    const formattedJson = (settings.google_service_account_credentials || '').replace(/\\n/g, '\n');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Update Google Sheet Settings</Button>
            </DialogTrigger>
            {/* --- Main changes made here --- */}
            <DialogContent className="flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Google Sheet Sync Settings</DialogTitle>
                    <DialogDescription>Google Sheet API information for data synchronization.</DialogDescription>
                </DialogHeader>
                {/* --- Form made into flex container --- */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* --- This DIV will now scroll --- */}
                    <div className="flex-1 overflow-y-auto space-y-4 p-1 -mr-6 pr-6">
                        <div className="space-y-2"> <Label htmlFor="google_sheet_id">Google Sheet ID</Label> <Input id="google_sheet_id" name="google_sheet_id" defaultValue={settings.google_sheet_id} /> </div>
                        <div className="space-y-2"> <Label htmlFor="google_sheet_name">Sheet Name (e.g., Sheet1)</Label> <Input id="google_sheet_name" name="google_sheet_name" defaultValue={settings.google_sheet_name} /> </div>
                        <div className="space-y-2"> 
                            <Label htmlFor="google_service_account_credentials">Service Account Credentials (JSON)</Label> 
                            <Textarea 
                                id="google_service_account_credentials" 
                                name="google_service_account_credentials" 
                                defaultValue={formattedJson}
                                rows={12} // A few more rows so scrolling is clear
                                className="whitespace-pre-wrap break-all"
                            /> 
                        </div>
                    </div>
                    {/* --- Footer is now outside scroll area --- */}
                    <DialogFooter className="pt-4 mt-4 border-t">
                        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Settings"}</Button>
                    </DialogFooter>
                    {message && <p className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                </form>
            </DialogContent>
        </Dialog>
    );
}