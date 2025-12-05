// src/components/custom/BlockerStatusManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toggleBlockerStatus } from "@/app/(main)/dashboard/work/[id]/actions";
import { AlertTriangle, CheckCircle, Loader2, Shield, Unlock, Lock, MessageSquare, X, AlertCircle } from "lucide-react";

interface BlockerStatusManagerProps {
  workId: number;
  isBlocked: boolean;
  blockerRemark: string | null;
}

export function BlockerStatusManager({ workId, isBlocked, blockerRemark }: BlockerStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = () => {
    if (!remark.trim()) return;

    startTransition(async () => {
      const result = await toggleBlockerStatus(workId, true, remark);
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' });
      } else {
        setMessage({ text: 'Work blocked successfully!', type: 'success' });
        setTimeout(() => {
          setIsOpen(false);
          setRemark("");
          setMessage(null);
        }, 1500);
      }
    });
  };

  const handleUnblock = () => {
    startTransition(async () => {
      const result = await toggleBlockerStatus(workId, false, null);
      if (result?.error) {
        setMessage({ text: result.error, type: 'error' });
      } else {
        setMessage({ text: 'Work unblocked successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 2000);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 ${isBlocked
              ? 'border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700 hover:text-red-800'
              : 'border-green-200 hover:bg-green-50 hover:border-green-300 text-green-700 hover:text-green-800'
            }`}
        >
          {isBlocked ? (
            <>
              <Lock className="h-4 w-4" />
              High Priority or Blocked
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4" />
              Report High Priority or Blockage
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isBlocked
                ? 'bg-gradient-to-br from-red-500 to-pink-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
              {isBlocked ? (
                <Lock className="h-4 w-4 text-white" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-white" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {isBlocked ? 'Work Status - High Priority or Blocked' : 'Report Work High Priority or Blockage'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            {isBlocked
              ? 'This work is currently marked as High Priority or Blocked. You can remove the status or update the reason.'
              : 'Please provide a detailed explanation of the issue preventing work progress.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isBlocked && blockerRemark && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Current Reason:</span>
              </div>
              <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">{blockerRemark}</p>
            </div>
          )}

          {!isBlocked && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reason
              </label>
              <Textarea
                placeholder="e.g., Material shortage, payment issues, weather conditions, regulatory approvals, etc."
                rows={5}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="border-slate-200 focus:border-red-500 focus:ring-red-500 resize-none"
              />
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${message.type === 'error'
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-green-700 bg-green-50 border-green-200'
              }`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-slate-200 hover:bg-slate-50"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {isBlocked ? (
            <Button
              onClick={handleUnblock}
              disabled={isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Remove Status
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isPending || !remark.trim()}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Mark as High Priority/Blocked
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}