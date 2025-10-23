// src/components/custom/ExportToExcelButton.tsx
"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/(main)/dashboard/actions";
import { Download, Loader2 } from "lucide-react";

export function ExportToExcelButton() {
  const [isPending, startTransition] = useTransition();
  // --- Updated here ---
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await exportToExcel();
      if (result.error) {
        setMessage(`Error: ${result.error}`);
      } else if (result.success) {
        // Create download link from Base64 data and click it
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
        <Button onClick={handleExport} disabled={isPending} variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isPending ? "Exporting..." : "Export to Excel"}
        </Button>
        {message && (
          <div className={`mt-2 text-xs p-2 rounded border ${
            message.startsWith('Error') 
              ? 'text-red-700 bg-red-50 border-red-200' 
              : 'text-green-700 bg-green-50 border-green-200'
          }`}>
            {message}
          </div>
        )}
    </div>
  );
}