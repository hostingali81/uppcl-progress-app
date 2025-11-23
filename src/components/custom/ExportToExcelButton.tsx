// src/components/custom/ExportToExcelButton.tsx
"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/(main)/dashboard/actions";
import { Download, Loader2 } from "lucide-react";

import type { Work } from "@/lib/types";

interface ExportToExcelButtonProps {
  selectedScheme: string;
  filteredWorks: Work[];
}

// All available columns (authoritative list)
const ALL_COLUMNS = [
  'id', 'scheme_name', 'zone_name', 'circle_name', 'division_name', 'sub_division_name', 'district_name', 'je_name',
  'work_category', 'wbs_code', 'work_name', 'amount_as_per_bp_lacs', 'boq_amount', 'agreement_amount', 'rate_as_per_ag',
  'tender_no', 'nit_date', 'part1_opening_date', 'loi_no_and_date', 'part2_opening_date', 'agreement_no_and_date',
  'firm_name_and_contact', 'firm_contact_no', 'firm_email', 'start_date', 'scheduled_completion_date', 'actual_completion_date', 'weightage', 'progress_percentage',
  'remark', 'mb_status', 'teco_status', 'fico_status', 'updated_at', 'is_blocked', 'blocker_remark',
  // Distribution
  'distribution_zone', 'distribution_circle', 'distribution_division', 'distribution_sub_division',
  // Billing
  'bill_no', 'bill_amount_with_tax'
];

// Default selected columns (only these should be checked by default)
const DEFAULT_SELECTED = [
  'scheme_name',
  'circle_name',
  'division_name',
  'sub_division_name',
  'district_name',
  'je_name',
  'work_category',
  'wbs_code',
  'work_name',
  'agreement_amount',
  'agreement_no_and_date',
  'firm_name_and_contact',
  'firm_contact_no',
  'start_date',
  'scheduled_completion_date',
  'actual_completion_date',
  'progress_percentage',
  'remark',
  'mb_status',
  'teco_status',
  'fico_status',
  'updated_at'
];

export function ExportToExcelButton({ selectedScheme, filteredWorks }: ExportToExcelButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Column selector state
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED.slice());

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const selectAll = () => setSelectedColumns(ALL_COLUMNS.slice());
  const clearAll = () => setSelectedColumns([]);

  const handleExport = (cols?: string[]) => {
    setMessage(null);
    startTransition(async () => {
      const colsToSend = cols ?? selectedColumns;
      const result = await exportToExcel(filteredWorks, colsToSend);
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
        setOpen(false);
      }
    });
  };

  return (
    <div className="relative flex flex-col items-start">
      <Button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-full text-xs sm:text-sm px-2 sm:px-3"
      >
        {isPending ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" /> : <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />}
        <span className="hidden sm:inline">{isPending ? "Exporting..." : "Export to Excel"}</span>
        <span className="sm:hidden">{isPending ? "..." : "Excel"}</span>
      </Button>

      {/* Column selector popover */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-h-[360px] overflow-auto bg-white border border-slate-200 rounded shadow-lg p-3 z-50">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm font-medium">Select columns to export</div>
            <div className="flex items-center gap-2">
              <button className="text-xs text-blue-600 hover:underline" onClick={selectAll}>Select all</button>
              <button className="text-xs text-slate-600 hover:underline" onClick={clearAll}>Clear</button>
              {/* Move action buttons to the top next to Select/Clear as requested */}
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport()} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Export'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {ALL_COLUMNS.map(col => (
              <label key={col} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={selectedColumns.includes(col)} onChange={() => toggleColumn(col)} />
                <span className="truncate">{col}</span>
              </label>
            ))}
          </div>

          {/* Buttons moved to header for easier access; keep this area for messages only */}
          {message && (
            <div className={`mt-2 text-xs p-2 rounded border ${message.startsWith('Error')
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-green-700 bg-green-50 border-green-200'
              }`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
