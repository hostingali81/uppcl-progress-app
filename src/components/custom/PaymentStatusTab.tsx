"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, Receipt, Calendar, User } from "lucide-react";
import type { Work, PaymentLog } from "@/lib/types";

interface PaymentStatusTabProps {
  work: Work;
  paymentLogs: PaymentLog[];
}

function formatAmount(amount: number | null | undefined): string {
  if (!amount) return '₹0.00';
  return `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

export function PaymentStatusTab({ work, paymentLogs }: PaymentStatusTabProps) {
  return (
    <div className="space-y-6">
      {/* Current Payment Status Card */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Current Payment Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Current Bill No.</p>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-slate-400" />
                <span className="text-lg font-semibold text-slate-900">
                  {work.bill_no || 'No bill generated'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Bill Amount (incl. tax)</p>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-slate-400" />
                <span className="text-lg font-semibold text-slate-900">
                  {formatAmount(work.bill_amount_with_tax)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Payment History</CardTitle>
            </div>
            {paymentLogs.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {paymentLogs.length} update{paymentLogs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paymentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="font-medium">Updated</TableHead>
                    <TableHead className="font-medium">Bill No.</TableHead>
                    <TableHead className="font-medium text-right">Amount</TableHead>
                    <TableHead className="font-medium">Updated By</TableHead>
                    <TableHead className="font-medium">Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-200">
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {formatTimeAgo(log.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          {log.previous_bill_no && (
                            <div className="text-sm text-slate-500 line-through">
                              {log.previous_bill_no}
                            </div>
                          )}
                          <div className="text-sm font-medium text-slate-900">
                            {log.new_bill_no || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="space-y-1">
                          {log.previous_bill_amount != null && (
                            <div className="text-sm text-slate-500 line-through">
                              {formatAmount(log.previous_bill_amount)}
                            </div>
                          )}
                          <div className="text-sm font-medium text-slate-900">
                            {formatAmount(log.new_bill_amount ?? null)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {log.user_email || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="text-sm text-slate-600">
                          {log.remark || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No payment updates recorded yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Payment history will appear here once bill details are updated
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}