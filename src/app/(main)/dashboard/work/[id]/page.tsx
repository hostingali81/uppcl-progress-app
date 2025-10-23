// src/app/(main)/dashboard/work/[id]/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, MapPin } from "lucide-react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { UpdateProgressForm } from "./UpdateProgressForm"; // This component's internals would also be updated
import { FileUploadManager } from "@/components/custom/FileUploadManager"; // Updated styling
import { CommentsSection } from "@/components/custom/CommentsSection"; // Updated styling
import { BlockerStatusManager } from "@/components/custom/BlockerStatusManager"; // Updated styling
import { ProgressLogsSection } from "@/components/custom/ProgressLogsSection"; // New component for progress logs

// A simple helper component for displaying details in a list.
// Styling is updated for better alignment and typography.
function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3 border-b border-slate-200 last:border-b-0">
            <dt className="text-sm font-medium text-slate-600">{label}</dt>
            <dd className="text-sm text-slate-900 md:col-span-2">{String(value)}</dd>
        </div>
    );
}

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // --- DATA FETCHING LOGIC IS UNCHANGED ---
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const workPromise = supabase
        .from("works")
        .select(`*, attachments (*), comments (*)`)
        .eq("id", id)
        .single();
    const usersPromise = supabase.from("profiles").select('id, full_name, role');
    const profilePromise = supabase.from("profiles").select('role').eq('id', user.id).single();
    const progressLogsPromise = supabase
        .from("progress_logs")
        .select('id, user_email, previous_progress, new_progress, remark, created_at')
        .eq('work_id', id)
        .order('created_at', { ascending: false });
    
    const [{ data: work, error: workError }, { data: allUsers }, { data: currentUserProfile }, { data: progressLogs }] = await Promise.all([workPromise, usersPromise, profilePromise, progressLogsPromise]);
        
    if (workError || !work) notFound();

    const usersForMentions = allUsers ? allUsers.map(u => ({ id: u.id, display: u.full_name || 'Unknown' })) : [];
    const currentUserRole = currentUserProfile?.role || 'user';
    // --- END OF DATA FETCHING LOGIC ---

    return (
        // Main container with consistent padding
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Page Header section */}
            <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                    <EnhancedButton variant="outline" size="icon" aria-label="Back to Dashboard" className="border-slate-200 hover:bg-slate-50">
                        <ArrowLeft className="h-4 w-4" />
                    </EnhancedButton>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Work Details</h1>
                    <p className="text-slate-600">Manage progress, files, and blockers for this work.</p>
                </div>
            </div>

            {/* Top grid for interactive components */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2">
                    <UpdateProgressForm
                      workId={work.id}
                      currentProgress={work.progress_percentage}
                      currentRemark={work.remark}
                    />
                </div>
                <div className="lg:col-span-3">
                     <BlockerStatusManager
                        workId={work.id}
                        isBlocked={work.is_blocked}
                        blockerRemark={work.blocker_remark}
                    />
                </div>
            </div>
            
            <FileUploadManager 
                workId={work.id} 
                attachments={work.attachments} 
                currentUserId={user.id}
            />

            {/* General Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold text-slate-900">{work.work_name}</CardTitle>
                            <CardDescription className="flex items-center space-x-2 pt-1">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700">{work.work_category || 'N/A'}</Badge>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600">WBS Code: {work.wbs_code || 'N/A'}</span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Scheme Name" value={work.scheme_name} />
                        <DetailRow label="Scheme Sr. No." value={work.scheme_sr_no} />
                        <DetailRow label="Work Category" value={work.work_category} />
                        <DetailRow label="Work Name" value={work.work_name} />
                    </dl>
                </CardContent>
            </Card>

            {/* Location Details Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Location Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Zone Name" value={work.zone_name} />
                        <DetailRow label="Circle Name" value={work.circle_name} />
                        <DetailRow label="Division Name" value={work.division_name} />
                        <DetailRow label="Sub-Division Name" value={work.sub_division_name} />
                        <DetailRow label="District Name" value={work.district_name} />
                        <DetailRow label="JE Name" value={work.je_name} />
                    </dl>
                </CardContent>
            </Card>

            {/* Financial Details Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Financial Details</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Amount as per BP (Lacs)" value={work.amount_as_per_bp_lacs} />
                        <DetailRow label="BOQ Amount" value={work.boq_amount} />
                        <DetailRow label="Agreement Amount" value={work.agreement_amount} />
                        <DetailRow label="Rate as per Agreement" value={work.rate_as_per_ag} />
                    </dl>
                </CardContent>
            </Card>

            {/* Tender Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Tender Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Tender No." value={work.tender_no} />
                        <DetailRow label="NIT Date" value={work.nit_date} />
                        <DetailRow label="Part 1 Opening Date" value={work.part1_opening_date} />
                        <DetailRow label="LOI No. and Date" value={work.loi_no_and_date} />
                        <DetailRow label="Part 2 Opening Date" value={work.part2_opening_date} />
                        <DetailRow label="Agreement No. and Date" value={work.agreement_no_and_date} />
                    </dl>
                </CardContent>
            </Card>

            {/* Contractor Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Contractor Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Firm Name and Contact" value={work.firm_name_and_contact} />
                        <DetailRow label="Firm Contact No." value={work.firm_contact_no} />
                    </dl>
                </CardContent>
            </Card>

            {/* Timeline Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-teal-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Timeline Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Start Date" value={work.start_date} />
                        <DetailRow label="Scheduled Completion Date" value={work.scheduled_completion_date} />
                        <DetailRow label="Weightage" value={work.weightage} />
                        <DetailRow label="Progress Percentage" value={`${work.progress_percentage || 0}%`} />
                    </dl>
                </CardContent>
            </Card>

            {/* Status Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">Status Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="MB Status" value={work.mb_status} />
                        <DetailRow label="TECO Status" value={work.teco_status} />
                        <DetailRow label="FICO Status" value={work.fico_status} />
                        <DetailRow label="Is Blocked" value={work.is_blocked ? 'Yes' : 'No'} />
                        <DetailRow label="Blocker Remark" value={work.blocker_remark} />
                        <DetailRow label="Remark" value={work.remark} />
                    </dl>
                </CardContent>
            </Card>

            {/* System Information Card */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <CardTitle className="text-lg font-semibold text-slate-900">System Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <dl>
                        <DetailRow label="Created At" value={work.created_at} />
                        <DetailRow label="Updated At" value={work.updated_at} />
                    </dl>
                </CardContent>
            </Card>

            {/* Progress Logs Section */}
            <ProgressLogsSection progressLogs={progressLogs || []} />

            <CommentsSection 
                workId={work.id} 
                comments={work.comments} 
                mentionUsers={usersForMentions}
                currentUserId={user.id}
                currentUserRole={currentUserRole}
            />
        </div>
    );
}