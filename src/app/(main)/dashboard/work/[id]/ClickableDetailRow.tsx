"use client";

import { useState } from 'react';
import { BillDetailsDialog } from '@/components/custom/BillDetailsDialog';

interface ClickableDetailRowProps {
    label: string;
    value: string;
    workId: number;
    paymentLogs: Array<{
        id: number;
        created_at: string;
        user_email: string;
        new_bill_no: string | null;
        new_bill_amount: number | null;
        remark: string | null;
    }>;
    className?: string;
}

export function ClickableDetailRow({ label, value, workId, paymentLogs, className = '' }: ClickableDetailRowProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (!value) return null;

    return (
        <>
            <div
                className={`group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 cursor-pointer ${className}`}
                onClick={() => setIsDialogOpen(true)}
            >
                <dt className="text-sm font-medium text-slate-600 flex-shrink-0 min-w-[140px]">{label}</dt>
                <dd className="text-sm text-slate-900 font-medium text-right flex-1 ml-4 hover:text-blue-600 transition-colors duration-200">
                    {value}
                </dd>
            </div>

            <BillDetailsDialog
                workId={workId}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                paymentLogs={paymentLogs}
            />
        </>
    );
}