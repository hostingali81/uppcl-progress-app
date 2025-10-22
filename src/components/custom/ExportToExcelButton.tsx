// src/components/custom/ExportToExcelButton.tsx
"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/(main)/dashboard/actions";
import { Download, Loader2 } from "lucide-react";

export function ExportToExcelButton() {
  const [isPending, startTransition] = useTransition();
  // --- यहाँ बदलाव किया गया है ---
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await exportToExcel();
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else if (result.success) {
        // Base64 डेटा से डाउनलोड लिंक बनाएँ और क्लिक करें
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.success.data}`;
        link.download = result.success.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage("Export successful!");
      }
    });
  };

  return (
    <div className="flex flex-col items-start">
        <Button onClick={handleExport} disabled={isPending} variant="outline" size="sm">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isPending ? "निर्यात हो रहा है..." : "एक्सेल में निर्यात करें"}
        </Button>
        {message && <p className={`mt-2 text-xs ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
    </div>
  );
}