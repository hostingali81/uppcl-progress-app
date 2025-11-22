// src/components/custom/PWASettingsDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { updatePWASettings } from '@/app/(main)/admin/settings/actions';

interface PWASettingsDialogProps {
    settings: {
        pwa_app_name?: string;
        pwa_short_name?: string;
        pwa_description?: string;
        pwa_theme_color?: string;
        pwa_background_color?: string;
    };
}

export function PWASettingsDialog({ settings }: PWASettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updatePWASettings(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(result.success || 'PWA settings updated!');
            setOpen(false);
        }

        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure PWA Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <DialogTitle>PWA / Android App Settings</DialogTitle>
                            <DialogDescription>
                                Configure app name, colors, and other PWA metadata
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* App Name */}
                    <div className="space-y-2">
                        <Label htmlFor="pwa_app_name">
                            App Name (Full) <span className="text-red-500">*</span>
                        </Label>
                        <input
                            id="pwa_app_name"
                            name="pwa_app_name"
                            type="text"
                            defaultValue={settings.pwa_app_name || 'UPPCL Progress Tracker'}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="UPPCL Progress Tracker"
                        />
                        <p className="text-xs text-gray-500">
                            Full app name shown in install prompt and app drawer
                        </p>
                    </div>

                    {/* Short Name */}
                    <div className="space-y-2">
                        <Label htmlFor="pwa_short_name">
                            Short Name <span className="text-red-500">*</span>
                        </Label>
                        <input
                            id="pwa_short_name"
                            name="pwa_short_name"
                            type="text"
                            defaultValue={settings.pwa_short_name || 'UPPCL'}
                            required
                            maxLength={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="UPPCL"
                        />
                        <p className="text-xs text-gray-500">
                            Short name shown on home screen (max 12 characters)
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="pwa_description">
                            App Description <span className="text-red-500">*</span>
                        </Label>
                        <textarea
                            id="pwa_description"
                            name="pwa_description"
                            defaultValue={settings.pwa_description || 'Track work progress offline and sync when online'}
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Track work progress offline and sync when online"
                        />
                        <p className="text-xs text-gray-500">
                            Description shown in app stores and install prompts
                        </p>
                    </div>

                    {/* Theme Color */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pwa_theme_color">
                                Theme Color <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <input
                                    id="pwa_theme_color"
                                    name="pwa_theme_color"
                                    type="color"
                                    defaultValue={settings.pwa_theme_color || '#3b82f6'}
                                    required
                                    className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
                                />
                                <input
                                    type="text"
                                    defaultValue={settings.pwa_theme_color || '#3b82f6'}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#3b82f6"
                                    onChange={(e) => {
                                        const colorInput = document.getElementById('pwa_theme_color') as HTMLInputElement;
                                        if (colorInput) colorInput.value = e.target.value;
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Status bar and toolbar color
                            </p>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-2">
                            <Label htmlFor="pwa_background_color">
                                Background Color <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <input
                                    id="pwa_background_color"
                                    name="pwa_background_color"
                                    type="color"
                                    defaultValue={settings.pwa_background_color || '#ffffff'}
                                    required
                                    className="h-10 w-16 border border-gray-300 rounded-md cursor-pointer"
                                />
                                <input
                                    type="text"
                                    defaultValue={settings.pwa_background_color || '#ffffff'}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#ffffff"
                                    onChange={(e) => {
                                        const colorInput = document.getElementById('pwa_background_color') as HTMLInputElement;
                                        if (colorInput) colorInput.value = e.target.value;
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Splash screen background
                            </p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📱 After Saving:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Rebuild the app: <code className="bg-blue-100 px-1 rounded">npm run build</code></li>
                            <li>• Changes will reflect in PWA manifest.json</li>
                            <li>• Users may need to reinstall the app to see changes</li>
                            <li>• For Android app, rebuild with Capacitor</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Save PWA Settings
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
