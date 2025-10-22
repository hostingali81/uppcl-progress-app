// src/components/custom/BlockerStatusManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={isBlocked ? "border-destructive" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isBlocked ? <AlertTriangle className="text-destructive" /> : <CheckCircle className="text-green-600" />}
          कार्य की स्थिति
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBlocked ? (
          <div className="space-y-4">
            <p className="text-destructive font-semibold">यह कार्य रुका हुआ है।</p>
            <div className="p-3 bg-red-50 rounded-md border border-red-200">
                <p className="text-sm font-medium text-gray-800">रुकावट का कारण:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{blockerRemark}</p>
            </div>
            <Button onClick={handleUnblock} disabled={isPending} variant="outline">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              रुकावट हटाएं
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-green-700">यह कार्य सामान्य रूप से चल रहा है।</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">कार्य में रुकावट चिह्नित करें</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>कार्य में रुकावट की रिपोर्ट करें</DialogTitle>
                  <DialogDescription>
                    कृपया रुकावट का कारण स्पष्ट रूप से बताएं। यह जानकारी प्रबंधकों को दिखाई देगी।
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="जैसे: मटेरियल की कमी, पेमेंट की समस्या, आदि।"
                    rows={4}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={isPending || !remark.trim()}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    रुकावट के रूप में सहेजें
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