// src/components/custom/BlockerStatusManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toggleBlockerStatus } from "@/app/(main)/dashboard/work/[id]/actions";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface BlockerStatusManagerProps {
  workId: number;
  isBlocked: boolean;
  blockerRemark: string | null;
}

export function BlockerStatusManager({ workId, isBlocked, blockerRemark }: BlockerStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [remark, setRemark] = useState("");

  const handleSubmit = () => {
    startTransition(async () => {
      await toggleBlockerStatus(workId, true, remark);
      setIsOpen(false);
      setRemark("");
    });
  };

  const handleUnblock = () => {
    startTransition(async () => {
      await toggleBlockerStatus(workId, false, null);
    });
  };

  return (
    <Card className={`border-slate-200 shadow-sm ${isBlocked ? "border-red-200 bg-red-50/50" : ""}`}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          ) : (
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          )}
          <CardTitle className="text-lg font-semibold text-slate-900">Work Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isBlocked ? (
          <div className="space-y-4">
            <p className="text-red-700 font-semibold">This work is currently blocked.</p>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-slate-800 mb-2">Reason for blockage:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{blockerRemark}</p>
            </div>
            <Button onClick={handleUnblock} disabled={isPending} variant="outline" className="border-slate-200 hover:bg-slate-50">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Blockage
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-green-700">This work is progressing normally.</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                  Mark Work as Blocked
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-slate-900">Report Work Blockage</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Please clearly explain the reason for the blockage. This information will be visible to managers.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="e.g., Material shortage, payment issues, etc."
                    rows={4}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="border-slate-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={isPending || !remark.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save as Blocked
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}