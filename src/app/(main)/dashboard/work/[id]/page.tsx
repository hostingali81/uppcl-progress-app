// src/app/(main)/dashboard/work/[id]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpdateProgressForm } from "./UpdateProgressForm";
import { FileUploadManager } from "@/components/custom/FileUploadManager";
import { CommentsSection } from "@/components/custom/CommentsSection";
import { BlockerStatusManager } from "@/components/custom/BlockerStatusManager"; // बाधा ट्रैकिंग कंपोनेंट को इम्पोर्ट करें

// हेल्पर कंपोनेंट (अपरिवर्तित)
function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b last:border-b-0">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="text-sm text-gray-900 md:col-span-2">{String(value)}</dd>
        </div>
    );
}

export default async function WorkDetailPage({ params }: { params: { id: string } }) {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect("/login");
    }

    // डेटा लाने का तरीका अपडेट किया गया है
    const workPromise = supabase
        .from("works")
        .select(`
            *,
            attachments ( id, file_url, file_name, uploader_id, uploader_full_name, created_at ),
            comments ( id, user_id, user_full_name, content, created_at, is_deleted, is_edited )
        `)
        .eq("id", params.id)
        .single();

    const usersPromise = supabase.from("profiles").select('id, full_name, role');
    const profilePromise = supabase.from("profiles").select('role').eq('id', user.id).single();

    const [
        { data: work, error: workError }, 
        { data: allUsers, error: usersError },
        { data: currentUserProfile, error: profileError }
    ] = await Promise.all([workPromise, usersPromise, profilePromise]);
        
    if (workError || !work) {
        console.error("Error fetching work details:", workError);
        notFound();
    }

    const usersForMentions = allUsers ? allUsers.map(u => ({ id: u.id, display: u.full_name || 'Unknown' })) : [];
    const currentUserRole = currentUserProfile?.role || 'user';

    return (
        <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center space-x-4 mb-4">
                <Link href="/dashboard"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
                <h1 className="text-2xl font-bold">कार्य का विवरण</h1>
            </div>

            <UpdateProgressForm
              workId={work.id}
              currentProgress={work.progress_percentage}
              currentRemark={work.remark}
            />

            {/* --- बाधा ट्रैकिंग सेक्शन को यहाँ जोड़ा गया है --- */}
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

            {/* ... (बाकी सभी डिटेल कार्ड अपरिवर्तित) ... */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">{work.work_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 pt-2">
                        <Badge variant="secondary">{work.work_category || 'N/A'}</Badge>
                        <span className="text-gray-400">•</span>
                        <span>WBS Code: {work.wbs_code || 'N/A'}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Scheme Name" value={work.scheme_name} />
                        <DetailRow label="Scheme Sr. No." value={work.scheme_sr_no} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>स्थान की जानकारी</CardTitle></CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Zone" value={work.zone_name} />
                        <DetailRow label="Circle" value={work.circle_name} />
                        <DetailRow label="Division" value={work.division_name} />
                        <DetailRow label="Sub-Division" value={work.sub_division_name} />
                        <DetailRow label="District" value={work.district_name} />
                        <DetailRow label="JE Name" value={work.je_name} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>प्रगति और समय-सीमा</CardTitle></CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Progress" value={`${work.progress_percentage || 0}%`} />
                        <DetailRow label="Start Date" value={work.start_date} />
                        <DetailRow label="Scheduled Completion" value={work.scheduled_completion_date} />
                        <DetailRow label="Weightage" value={work.weightage} />
                        <DetailRow label="Remark" value={work.remark} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>वित्तीय और फर्म की जानकारी</CardTitle></CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Amount as per BP (Lacs)" value={work.amount_as_per_bp_lacs} />
                        <DetailRow label="BoQ Amount" value={work.boq_amount} />
                        <DetailRow label="Agreement Amount" value={work.agreement_amount} />
                        <DetailRow label="Rate as per Agreement" value={work.rate_as_per_ag} />
                        <DetailRow label="Firm Name & Contact" value={work.firm_name_and_contact} />
                        <DetailRow label="Firm Contact No." value={work.firm_contact_no} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>टेंडर और एग्रीमेंट की जानकारी</CardTitle></CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="Tender No." value={work.tender_no} />
                        <DetailRow label="NIT Date" value={work.nit_date} />
                        <DetailRow label="Part-I Opening Date" value={work.part1_opening_date} />
                        <DetailRow label="Part-II Opening Date" value={work.part2_opening_date} />
                        <DetailRow label="LoI No. & Date" value={work.loi_no_and_date} />
                        <DetailRow label="Agreement No. & Date" value={work.agreement_no_and_date} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>स्टेटस</CardTitle></CardHeader>
                <CardContent>
                    <dl className="divide-y divide-gray-200">
                        <DetailRow label="MB Status" value={work.mb_status} />
                        <DetailRow label="TECO Status" value={work.teco_status} />
                        <DetailRow label="FICO Status" value={work.fico_status} />
                    </dl>
                </CardContent>
            </Card>
            
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