"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Loader2, Check, X, Save } from "lucide-react";
import { toast } from "sonner";
import { updateNotificationSettings } from "@/app/(main)/admin/settings/actions";

interface RoleSettings {
    comments?: boolean;
    mentions?: boolean;
    progress_updates?: boolean;
    file_uploads?: boolean;
}

interface NotificationSettings {
    [role: string]: RoleSettings;
}

interface NotificationSettingsDialogProps {
    initialSettings: NotificationSettings;
}

// Role display names
const ROLES = [
    { key: 'superadmin', label: 'Super Admin' },
    { key: 'admin', label: 'Admin' },
    { key: 'zone_head', label: 'Zone Head' },
    { key: 'circle_head', label: 'Circle Head' },
    { key: 'division_head', label: 'Division Head' },
    { key: 'sub_division_head', label: 'Sub Division Head' },
    { key: 'je', label: 'JE (Junior Engineer)' },
];

export function NotificationSettingsDialog({ initialSettings }: NotificationSettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>(initialSettings || {});
    const [isPending, startTransition] = useTransition();

    const toggleSetting = (role: string, type: 'comments' | 'mentions' | 'progress_updates' | 'file_uploads') => {
        setSettings(prev => {
            const roleSettings = prev[role] || { comments: true, mentions: true, progress_updates: true, file_uploads: true };
            return {
                ...prev,
                [role]: {
                    ...roleSettings,
                    [type]: !roleSettings[type]
                }
            };
        });
    };

    const isEnabled = (role: string, type: 'comments' | 'mentions' | 'progress_updates' | 'file_uploads') => {
        const roleSettings = settings[role];
        // Default to true if not explicitly set
        return roleSettings?.[type] ?? true;
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateNotificationSettings(settings);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Notification settings updated successfully");
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Manage Notification Preferences
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Notification Settings (Role-Based)</DialogTitle>
                    <DialogDescription>
                        Control which activities trigger notifications for each role.
                        Green check means notifications are ENABLED.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Role</TableHead>
                                <TableHead className="text-center">Comments</TableHead>
                                <TableHead className="text-center">Mentions</TableHead>
                                <TableHead className="text-center">Progress Updates</TableHead>
                                <TableHead className="text-center">File Uploads</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ROLES.map((role) => (
                                <TableRow key={role.key}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{role.label}</span>
                                            <span className="text-xs text-slate-500">{role.key}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant={isEnabled(role.key, 'comments') ? "default" : "outline"}
                                            size="sm"
                                            className={`w-8 h-8 p-0 ${isEnabled(role.key, 'comments') ? 'bg-green-600 hover:bg-green-700' : 'text-slate-400'}`}
                                            onClick={() => toggleSetting(role.key, 'comments')}
                                        >
                                            {isEnabled(role.key, 'comments') ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant={isEnabled(role.key, 'mentions') ? "default" : "outline"}
                                            size="sm"
                                            className={`w-8 h-8 p-0 ${isEnabled(role.key, 'mentions') ? 'bg-green-600 hover:bg-green-700' : 'text-slate-400'}`}
                                            onClick={() => toggleSetting(role.key, 'mentions')}
                                        >
                                            {isEnabled(role.key, 'mentions') ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant={isEnabled(role.key, 'progress_updates') ? "default" : "outline"}
                                            size="sm"
                                            className={`w-8 h-8 p-0 ${isEnabled(role.key, 'progress_updates') ? 'bg-green-600 hover:bg-green-700' : 'text-slate-400'}`}
                                            onClick={() => toggleSetting(role.key, 'progress_updates')}
                                        >
                                            {isEnabled(role.key, 'progress_updates') ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant={isEnabled(role.key, 'file_uploads') ? "default" : "outline"}
                                            size="sm"
                                            className={`w-8 h-8 p-0 ${isEnabled(role.key, 'file_uploads') ? 'bg-green-600 hover:bg-green-700' : 'text-slate-400'}`}
                                            onClick={() => toggleSetting(role.key, 'file_uploads')}
                                        >
                                            {isEnabled(role.key, 'file_uploads') ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
