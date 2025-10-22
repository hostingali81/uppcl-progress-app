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
                <Button>Google Sheet सेटिंग्स अपडेट करें</Button>
            </DialogTrigger>
            {/* --- यहाँ मुख्य बदलाव किया गया है --- */}
            <DialogContent className="flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Google Sheet सिंक सेटिंग्स</DialogTitle>
                    <DialogDescription>डेटा सिंक करने के लिए Google Sheet API की जानकारी।</DialogDescription>
                </DialogHeader>
                {/* --- फॉर्म को फ्लेक्स कंटेनर बनाया गया है --- */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    {/* --- यह DIV अब स्क्रॉल होगा --- */}
                    <div className="flex-1 overflow-y-auto space-y-4 p-1 -mr-6 pr-6">
                        <div className="space-y-2"> <Label htmlFor="google_sheet_id">Google Sheet ID</Label> <Input id="google_sheet_id" name="google_sheet_id" defaultValue={settings.google_sheet_id} /> </div>
                        <div className="space-y-2"> <Label htmlFor="google_sheet_name">Sheet Name (e.g., Sheet1)</Label> <Input id="google_sheet_name" name="google_sheet_name" defaultValue={settings.google_sheet_name} /> </div>
                        <div className="space-y-2"> 
                            <Label htmlFor="google_service_account_credentials">Service Account Credentials (JSON)</Label> 
                            <Textarea 
                                id="google_service_account_credentials" 
                                name="google_service_account_credentials" 
                                defaultValue={formattedJson}
                                rows={12} // थोड़ी और पंक्तियाँ ताकि स्क्रॉलिंग स्पष्ट हो
                                className="whitespace-pre-wrap break-all"
                            /> 
                        </div>
                    </div>
                    {/* --- फुटर अब स्क्रॉल एरिया से बाहर है --- */}
                    <DialogFooter className="pt-4 mt-4 border-t">
                        <Button type="submit" disabled={isPending}>{isPending ? "सेव हो रहा है..." : "सेटिंग्स सेव करें"}</Button>
                    </DialogFooter>
                    {message && <p className={`mt-2 text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
                </form>
            </DialogContent>
        </Dialog>
    );
}