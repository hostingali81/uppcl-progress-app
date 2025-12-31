"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, MapPin as LocationIcon, FileText as DocumentIcon, DollarSign as MoneyIcon, Calendar as CalendarIcon, BarChartIcon } from "lucide-react";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClickableDetailRow } from './ClickableDetailRow';
import EditableStatusRow, { EditableDetailRow } from './EditableStatusRow';
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { formatIndianCurrency } from '@/lib/formatters';
import { UpdateProgressForm } from "./UpdateProgressForm";
import { UpdateBillingForm } from "./UpdateBillingForm";
import { FileUploadManager } from "@/components/custom/FileUploadManager";
import { CommentsSection } from "@/components/custom/CommentsSection";
import { BlockerStatusManager } from "@/components/custom/BlockerStatusManager";
import { ProgressLogsSection } from "@/components/custom/ProgressLogsSection";
import { ActivityProgressForm } from "@/components/custom/ActivityProgressForm";

import { TimelineChart } from "@/components/custom/TimelineChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";



interface WorkData {
    id: number;
    // Add other fields as needed
    [key: string]: any;
}

interface WorkDetailClientProps {
    work: WorkData;
    usersForMentions: any[];
    currentUserRole: string;
    currentUserId: string;
    totalBillAmount: number;
    latestBillNumber: string;
    paymentLogs: any[];
    progressLogs: any[];
    comments: any[];
    suggestions?: Record<string, string[]>;
    allAttachments?: any[];
}

// Enhanced editable detail row component
type DetailRowProps = {
    label: string;
    value: string | number | null | undefined;
    fieldName?: string;
    workId?: number;
    type?: 'text' | 'number' | 'date';
    suggestions?: string[];
}

function DetailRow({ label, value, fieldName, workId, type = 'text', suggestions }: DetailRowProps) {
    if (!fieldName || !workId) {
        if (value === null || value === undefined || value === '') return null;
        return (
            <div className="group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0">
                <dt className="text-sm font-medium text-slate-600 flex-shrink-0 min-w-[140px]">{label}</dt>
                <dd className="text-sm text-slate-900 font-medium text-right flex-1 ml-4">{String(value)}</dd>
            </div>
        );
    }
    return <EditableDetailRow label={label} fieldName={fieldName as any} currentValue={value} workId={workId} suggestions={suggestions} />;
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

export default function WorkDetailClient({
    work,
    usersForMentions,
    currentUserRole,
    currentUserId,
    totalBillAmount,
    latestBillNumber,
    paymentLogs,
    progressLogs,
    comments,
    suggestions = {},
    allAttachments = []
}: WorkDetailClientProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const searchParams = useSearchParams();
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    console.log('WorkDetailClient rendered. Comments:', comments);
    if (comments && comments.length > 0) {
        console.log('First comment attachments:', comments[0].attachments);
    }

    useEffect(() => {
        const successMessage = searchParams.get('success');
        const errorMessage = searchParams.get('error');

        if (successMessage) {
            setNotification({ type: 'success', message: decodeURIComponent(successMessage) });
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        } else if (errorMessage) {
            setNotification({ type: 'error', message: decodeURIComponent(errorMessage) });
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

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

            {/* Success/Error Notification */}
            {notification && (
                <div className="p-4 sm:p-6">
                    <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${notification.type === 'error'
                        ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-green-700 bg-green-50 border-green-200'
                        }`}>
                        {notification.type === 'error' ? (
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        ) : (
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Quick Actions Bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
                                currentUserId={currentUserId}
                            />
                        </div>
                    </div>
                </div>

                {/* General Information and Status Cards Grid */}
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
                                <DetailRow label="Scheme Name" value={work.scheme_name} fieldName="scheme_name" workId={work.id} suggestions={suggestions.scheme_name} />
                                <DetailRow label="Scheme Sr. No." value={work.scheme_sr_no} fieldName="scheme_sr_no" workId={work.id} />
                                <DetailRow label="Work Category" value={work.work_category} fieldName="work_category" workId={work.id} suggestions={suggestions.work_category} />
                                <DetailRow label="Site Name" value={work.site_name} fieldName="site_name" workId={work.id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Information Card */}
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
                                <DetailRow label="WBS Code" value={work.wbs_code} fieldName="wbs_code" workId={work.id} />
                                <EditableStatusRow label="MB Status" fieldName="mb_status" currentValue={work.mb_status} workId={work.id} />
                                <EditableStatusRow label="TECO Status" fieldName="teco_status" currentValue={work.teco_status || work.teco} workId={work.id} />
                                <EditableStatusRow label="FICO Status" fieldName="fico_status" currentValue={work.fico_status || work.fico} workId={work.id} />
                                <DetailRow label="Is High Priority or Blocked" value={work.is_blocked ? 'Yes' : 'No'} />
                                <DetailRow label="Last Bill No." value={latestBillNumber} />
                                <ClickableDetailRow
                                    label="Total Billed Amount"
                                    value={totalBillAmount > 0 ? formatIndianCurrency(totalBillAmount) : 'N/A'}
                                    workId={work.id}
                                    paymentLogs={paymentLogs || []}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline Information */}
                <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                                <CalendarIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl font-bold text-slate-900">Timeline Information</CardTitle>
                                <CardDescription className="text-slate-600">Project schedule and milestones</CardDescription>
                            </div>
                            <Link href={`/dashboard/work/${work.id}/schedule`}>
                                <EnhancedButton variant="default" size="sm" className="h-8 gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                                    <FileText className="h-4 w-4" />
                                    Detailed Schedule
                                </EnhancedButton>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            <DetailRow label="Date of Start" value={work.start_date} fieldName="start_date" workId={work.id} type="date" />
                            <DetailRow label="Scheduled Date of Completion" value={work.scheduled_completion_date} fieldName="scheduled_completion_date" workId={work.id} type="date" />
                            <DetailRow label="Expected Date of Completion" value={work.expected_completion_date} fieldName="expected_completion_date" workId={work.id} type="date" />
                            <DetailRow label="Actual Date of Completion" value={work.actual_completion_date} fieldName="actual_completion_date" workId={work.id} type="date" />
                            <DetailRow label="Current Progress" value={work.progress_percentage ? `${work.progress_percentage}%` : '0%'} />
                            <div className="group flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 gap-2">
                                <dt className="text-sm font-medium text-slate-600 flex-shrink-0">Remark</dt>
                                <dd className="text-sm text-slate-900 font-medium sm:text-right break-words max-w-full">{work.remark || '-'}</dd>
                            </div>
                        </div>
                    </CardContent>
                </Card>


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
                            <DetailRow label="Sanction Amount (Lacs)" value={work.sanction_amount_lacs ? `₹${work.sanction_amount_lacs.toFixed(2)} Lakhs` : 'N/A'} fieldName="sanction_amount_lacs" workId={work.id} type="number" />
                            <DetailRow label="Agreement Amount" value={work.agreement_amount ? formatIndianCurrency(work.agreement_amount) : 'N/A'} fieldName="agreement_amount" workId={work.id} type="number" />
                            <DetailRow label="BOQ Amount" value={work.boq_amount ? formatIndianCurrency(work.boq_amount) : 'N/A'} fieldName="boq_amount" workId={work.id} type="number" />
                        </div>
                    </CardContent>
                </Card>

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
                                <DetailRow label="Tender No." value={work.tender_no} fieldName="tender_no" workId={work.id} />
                                <DetailRow label="NIT Date" value={work.nit_date} fieldName="nit_date" workId={work.id} type="date" />
                                <DetailRow label="LOI No. and Date" value={work.loi_no_and_date} fieldName="loi_no_and_date" workId={work.id} />
                                <DetailRow label="Part 2 Opening Date" value={work.part2_opening_date} fieldName="part2_opening_date" workId={work.id} type="date" />
                                <DetailRow label="Agreement No. and Date" value={work.agreement_no_and_date} fieldName="agreement_no_and_date" workId={work.id} />
                                <DetailRow label="Weightage" value={work.weightage} fieldName="weightage" workId={work.id} type="number" />
                                <DetailRow label="Rate as per Ag." value={work.rate_as_per_ag} fieldName="rate_as_per_ag" workId={work.id} />
                                <DetailRow label="Firm Name and Contact" value={work.firm_name_and_contact} fieldName="firm_name_and_contact" workId={work.id} suggestions={suggestions.firm_name_and_contact} />
                                <DetailRow label="Firm Contact No." value={work.firm_contact_no} fieldName="firm_contact_no" workId={work.id} />
                                <DetailRow label="Firm Email" value={work.firm_email} fieldName="firm_email" workId={work.id} />
                            </div>
                        </CardContent>
                    </Card>

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
                                <EditableDetailRow label="Distribution Zone" fieldName="distribution_zone" currentValue={work.distribution_zone} workId={work.id} suggestions={suggestions.distribution_zone} />
                                <EditableDetailRow label="Distribution Circle" fieldName="distribution_circle" currentValue={work.distribution_circle} workId={work.id} suggestions={suggestions.distribution_circle} />
                                <EditableDetailRow label="Distribution Division" fieldName="distribution_division" currentValue={work.distribution_division} workId={work.id} suggestions={suggestions.distribution_division} />
                                <EditableDetailRow label="Distribution Sub-Division" fieldName="distribution_sub_division" currentValue={work.distribution_sub_division} workId={work.id} suggestions={suggestions.distribution_sub_division} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Logs & Comments Section */}
                <div className="space-y-6">
                    <ActivityProgressForm workId={work.id} />
                    
                    <ProgressLogsSection
                        progressLogs={progressLogs}
                        allAttachments={allAttachments}
                    />

                    <CommentsSection
                        workId={work.id}
                        comments={comments || []}
                        mentionUsers={usersForMentions}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                    />
                </div>
            </div>
        </div>
    );
}
