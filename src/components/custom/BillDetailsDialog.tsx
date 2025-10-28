"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Receipt, Clock } from "lucide-react";

interface BillDetailsDialogProps {
  workId: number;
  isOpen: boolean;
  onClose: () => void;
  paymentLogs: Array<{
    id: number;
    created_at: string;
    user_email: string;
    new_bill_no: string | null;
    new_bill_amount: number | null;
    remark: string | null;
  }>;
}

export function BillDetailsDialog({ workId, isOpen, onClose, paymentLogs }: BillDetailsDialogProps) {
  // Sort logs by created_at in descending order (newest first)
  const sortedLogs = [...paymentLogs].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate total billed amount
  const totalAmount = sortedLogs.reduce((sum, log) => sum + (log.new_bill_amount || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Bill Details</DialogTitle>
              <DialogDescription className="text-slate-600">
                Complete billing history for this work
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Card */}
        <Card className="p-4 bg-gradient-to-br from-slate-50 to-purple-50 border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Total Bills</p>
              <p className="text-2xl font-bold text-slate-900">{sortedLogs.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        {/* Bills Table */}
        <div className="overflow-y-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead className="font-semibold text-slate-900">Bill No.</TableHead>
                <TableHead className="font-semibold text-slate-900">Amount (₹)</TableHead>
                <TableHead className="font-semibold text-slate-900">Date</TableHead>
                <TableHead className="font-semibold text-slate-900">Added By</TableHead>
                <TableHead className="font-semibold text-slate-900">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.new_bill_no || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {log.new_bill_amount?.toLocaleString('en-IN') || 'N/A'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.remark || ''}>
                      {log.remark || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No bills have been added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}