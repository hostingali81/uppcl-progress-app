// src/app/(main)/dashboard/work/[id]/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, MapPin, DollarSign, Calendar, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Building2, MapPin as LocationIcon, FileText as DocumentIcon, DollarSign as MoneyIcon, Calendar as CalendarIcon, Users as TeamIcon, Settings } from "lucide-react";
import { ClickableDetailRow } from './ClickableDetailRow';
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { UpdateProgressForm } from "./UpdateProgressForm";
import { UpdateBillingForm } from "./UpdateBillingForm";
import { FileUploadManager } from "@/components/custom/FileUploadManager";
import { CommentsSection } from "@/components/custom/CommentsSection";
import { BlockerStatusManager } from "@/components/custom/BlockerStatusManager";
import { ProgressLogsSection } from "@/components/custom/ProgressLogsSection";
import { PaymentStatusTab } from "@/components/custom/PaymentStatusTab";

// Enhanced detail row component with modern styling
type DetailRowProps = {
    label: string;
    value: string | number | null | undefined;
    onClick?: () => void;
}

function DetailRow({ label, value, onClick }: DetailRowProps) {
    if (value === null || value === undefined || value === '') return null;
    
    const baseClasses = "group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0";
    const clickableClasses = onClick ? "cursor-pointer" : "";
    
    return (
        <div className={`${baseClasses} ${clickableClasses}`} onClick={onClick}>
            <dt className="text-sm font-medium text-slate-600 flex-shrink-0 min-w-[140px]">{label}</dt>
            <dd className={`text-sm text-slate-900 font-medium text-right flex-1 ml-4 ${onClick ? 'hover:text-blue-600 transition-colors duration-200' : ''}`}>
                {String(value)}
            </dd>
        </div>
    );
}

// Progress indicator component
function ProgressIndicator({ progress }: { progress: number | null }) {
    const percentage = progress || 0;
    const getProgressColor = (p: number) => {
        if (p >= 100) return 'bg-green-500';
        if (p >= 75) return 'bg-blue-500';
        if (p >= 50) return 'bg-yellow-500';
        if (p >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex items-center space-x-3">
            <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-sm font-semibold text-slate-700 min-w-[45px]">{percentage}%</span>
        </div>
    );
}

// Status badge component
function StatusBadge({ status, type }: { status: string; type: 'success' | 'warning' | 'error' | 'info' }) {
    const getStatusStyles = () => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800 border-green-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'error': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <Badge variant="outline" className={`${getStatusStyles()} font-medium px-3 py-1`}>
            {status}
        </Badge>
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
        .select(`
            id, work_id, user_email, previous_progress, new_progress, remark, created_at,
            attachments:attachments(*)
        `)
        .eq('work_id', id)
        .order('created_at', { ascending: false });

    const paymentLogsPromise = supabase
        .from('payment_logs')
        .select('id, work_id, user_id, created_at, user_email, previous_bill_no, previous_bill_amount, new_bill_no, new_bill_amount, remark')
        .eq('work_id', id)
        .order('created_at', { ascending: false });
    
    const [{ data: work, error: workError }, { data: allUsers }, { data: currentUserProfile }, { data: progressLogs }, { data: paymentLogs }] = await Promise.all([workPromise, usersPromise, profilePromise, progressLogsPromise, paymentLogsPromise]);
        
    if (workError || !work) notFound();

    const usersForMentions = allUsers ? allUsers.map(u => ({ id: u.id, display: u.full_name || 'Unknown' })) : [];
    const currentUserRole = currentUserProfile?.role || 'user';
    
    // Calculate billing summary
    const totalBillAmount = paymentLogs?.reduce((sum, log) => sum + (log.new_bill_amount || 0), 0) || 0;
    const latestBill = paymentLogs && paymentLogs.length > 0 ? paymentLogs[0] : null;
    const latestBillNumber = latestBill?.new_bill_no || 'N/A';
    // --- END OF DATA FETCHING LOGIC ---

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            {/* Compact Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <EnhancedButton 
                                variant="outline" 
                                size="icon" 
                                aria-label="Back to Dashboard" 
                                className="border-slate-200 hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </EnhancedButton>
                        </Link>
                        <h1 className="text-lg font-bold text-slate-900">
                            {work.work_name || 'Work Details'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Quick Actions Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                            <span className="text-sm text-slate-500">Manage your work efficiently</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <UpdateProgressForm
                                workId={work.id}
                                currentProgress={work.progress_percentage}
                                currentRemark={work.remark}
                                currentExpectedCompletionDate={work.expected_completion_date}
                                currentActualCompletionDate={work.actual_completion_date}
                            />
                            <UpdateBillingForm 
                                workId={work.id} 
                                paymentLogs={paymentLogs || []} 
                            />
                            <BlockerStatusManager
                                workId={work.id}
                                isBlocked={work.is_blocked}
                                blockerRemark={work.blocker_remark}
                            />
                            <FileUploadManager 
                                workId={work.id} 
                                attachments={work.attachments} 
                                currentUserId={user.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Information Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* General Information Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <DocumentIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">General Information</CardTitle>
                                    <CardDescription className="text-slate-600">Project details and specifications</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <DetailRow label="Scheme Name" value={work.scheme_name} />
                                <DetailRow label="Scheme Sr. No." value={work.scheme_sr_no} />
                                <DetailRow label="Work Category" value={work.work_category} />
                                <DetailRow label="Site Name" value={work.site_name} />
                                <DetailRow label="District Name" value={work.district_name} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Details Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <LocationIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Location Details</CardTitle>
                                    <CardDescription className="text-slate-600">Geographical and administrative information</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <DetailRow label="Zone Name" value={work.zone_name} />
                                <DetailRow label="Circle Name" value={work.circle_name} />
                                <DetailRow label="Division Name" value={work.division_name} />
                                <DetailRow label="Sub-Division Name" value={work.sub_division_name} />
                                <DetailRow label="JE Name" value={work.je_name} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial & Timeline Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Financial Details Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <MoneyIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Financial Details</CardTitle>
                                    <CardDescription className="text-slate-600">Budget and cost information</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <DetailRow label="Amount" value={work.amount_as_per_bp_lacs ?? work.sanction_amount_lacs} />
                                <DetailRow label="Agreement Amount" value={work.agreement_amount} />
                                <DetailRow label="BOQ Amount" value={work.boq_amount} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timeline Information Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <CalendarIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Timeline Information</CardTitle>
                                    <CardDescription className="text-slate-600">Project schedule and milestones</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <DetailRow label="Date of Start (As per Agr./ Actual)" value={work.start_date} />
                                <DetailRow label="Scheduled Date of Completion" value={work.scheduled_completion_date} />
                                <DetailRow label="Expected Date of Completion" value={work.expected_completion_date} />
                                <DetailRow label="Actual Date of Completion" value={work.actual_completion_date} />
                                <DetailRow label="Remark" value={work.remark} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tender & Contractor Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tender Information Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <DocumentIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Tender & Contractor Information</CardTitle>
                                    <CardDescription className="text-slate-600">Procurement, contractor and bidding details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <DetailRow label="Tender No." value={work.tender_no} />
                                <DetailRow label="NIT Date" value={work.nit_date} />
                                <DetailRow label="LOI No. and Date" value={work.loi_no_and_date} />
                                <DetailRow label="Part 2 Opening Date" value={work.part2_opening_date} />
                                <DetailRow label="Agreement No. and Date" value={work.agreement_no_and_date} />
                                <DetailRow label="Weightage" value={work.weightage} />
                                <DetailRow label="Rate as per Ag. (% above/ below)" value={work.rate_as_per_ag} />
                                <DetailRow label="Firm Name and Contact" value={work.firm_name_and_contact} />
                                <DetailRow label="Firm Contact No." value={work.firm_contact_no} />
                                <DetailRow label="Firm Email" value={work.firm_email} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contractor Information card removed per user request */}

                    {/* Distribution Location Detail Card */}
                    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <LocationIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">Distribution Location Detail</CardTitle>
                                    <CardDescription className="text-slate-600">Distribution administrative details</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                    <DetailRow label="Distribution Zone" value={work.distribution_zone ?? 'N/A'} />
                                    <DetailRow label="Distribution Circle" value={work.distribution_circle ?? 'N/A'} />
                                    <DetailRow label="Distribution Division" value={work.distribution_division ?? 'N/A'} />
                                    <DetailRow label="Distribution Sub-Division" value={work.distribution_sub_division ?? 'N/A'} />
                                </div>
                            </CardContent>
                    </Card>
                </div>

                {/* Status Information Card (updated per user request) */}
                <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-slate-900">Status Information</CardTitle>
                                <CardDescription className="text-slate-600">Project status and approvals</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <DetailRow label="WBS Code" value={work.wbs_code} />
                            <DetailRow label="MB Status" value={work.mb_status} />
                            <DetailRow label="TECO Status" value={work.teco_status || work.teco} />
                            <DetailRow label="FICO Status" value={work.fico_status || work.fico} />
                            <DetailRow label="Is Blocked" value={work.is_blocked ? 'Yes' : 'No'} />
                            <DetailRow label="Last Bill No." value={latestBillNumber} />
                            <ClickableDetailRow 
                                label="Total Billed Amount" 
                                value={totalBillAmount > 0 ? `₹${totalBillAmount.toLocaleString()}` : 'N/A'} 
                                workId={parseInt(id)}
                                paymentLogs={paymentLogs || []}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Logs & Comments Section */}
                <div className="space-y-6">
                    <ProgressLogsSection progressLogs={progressLogs || []} />

                        <CommentsSection 
                            workId={work.id} 
                            comments={work.comments} 
                            mentionUsers={usersForMentions}
                            currentUserId={user.id}
                            currentUserRole={currentUserRole}
                        />
                </div>
            </div>
        </div>
    );
}
