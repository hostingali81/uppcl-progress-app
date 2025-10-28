"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Loader2 } from "lucide-react";
import { updateBillingDetails } from "./actions";
import type { PaymentLog } from "@/lib/types";

interface UpdateBillingFormProps {
  workId: number | string;
  paymentLogs: PaymentLog[];
}

const MAX_BILL_NUMBER = 20; // Assumption: Max 20 bills per work

export function UpdateBillingForm({ workId, paymentLogs }: UpdateBillingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [billNumber, setBillNumber] = useState<string>("");
  const [billAmount, setBillAmount] = useState<string>("");
  const [remark, setRemark] = useState<string>("");

  const existingBillNumbers = paymentLogs.map(log => log.new_bill_no).filter(Boolean);
  const availableBillNumbers = Array.from({ length: MAX_BILL_NUMBER }, (_, i) => (i + 1).toString())
    .filter(num => !existingBillNumbers.includes(num));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!billNumber || !billAmount) {
      toast.error("Bill number and amount are required.");
      return;
    }

    startTransition(async () => {
      const result = await updateBillingDetails({
        workId: Number(workId),
        billNo: billNumber,
        billAmount: parseFloat(billAmount),
        remark,
      });

      if (result.error) {
        toast.error(`Failed to update billing: ${result.error}`);
      } else {
        toast.success("Billing details updated successfully!");
        setIsOpen(false);
        // Reset form
        setBillNumber("");
        setBillAmount("");
        setRemark("");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
          <DollarSign className="mr-2 h-4 w-4" />
          Update Billing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Billing Details</DialogTitle>
          <DialogDescription>
            Submit a new bill for this work. Previously submitted bill numbers are not available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-number" className="text-right">
                Bill No.
              </Label>
              <Select onValueChange={setBillNumber} value={billNumber}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a bill number" />
                </SelectTrigger>
                <SelectContent>
                  {availableBillNumbers.map(num => (
                    <SelectItem key={num} value={num}>
                      {`Bill No. ${num}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="bill-amount"
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                className="col-span-3"
                placeholder="Enter bill amount"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remark" className="text-right">
                Remark
              </Label>
              <Input
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="col-span-3"
                placeholder="Optional remark"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
