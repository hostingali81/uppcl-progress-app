import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/(main)/dashboard/actions";
import { Download, Loader2, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { generateSummaryData } from "@/lib/reportUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { Work } from "@/lib/types";

interface ExportToExcelButtonProps {
  selectedScheme: string;
  filteredWorks: Work[];
  isSummary?: boolean;
  groupingField?: keyof Work;
  groupingLabel?: string;
  schemeName?: string;
  officeName?: string;
  userId: string;
}

// All available columns (authoritative list)
const ALL_COLUMNS = [
  'id', 'scheme_name', 'zone_name', 'circle_name', 'division_name', 'sub_division_name', 'district_name', 'je_name',
  'work_category', 'wbs_code', 'work_name', 'sanction_amount_lacs', 'amount_as_per_bp_lacs', 'boq_amount', 'agreement_amount', 'rate_as_per_ag',
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

export function ExportToExcelButton({ selectedScheme, filteredWorks, isSummary, groupingField = 'civil_zone', groupingLabel = 'Zone Name', schemeName = 'All Schemes', officeName = 'UPPCL', userId }: ExportToExcelButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Column selector state
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED.slice());

  // Load persisted columns on mount
  useEffect(() => {
    if (userId) {
      const savedCols = localStorage.getItem(`export_cols_excel_${userId}`);
      if (savedCols) {
        try {
          const parsed = JSON.parse(savedCols);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedColumns(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved columns", e);
        }
      }
    }
  }, [userId]);

  // Save columns when changed
  useEffect(() => {
    if (userId && selectedColumns.length > 0) {
      localStorage.setItem(`export_cols_excel_${userId}`, JSON.stringify(selectedColumns));
    }
  }, [selectedColumns, userId]);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const selectAll = () => setSelectedColumns(ALL_COLUMNS.slice());
  const clearAll = () => setSelectedColumns([]);

  const handleExport = (cols?: string[]) => {
    setMessage(null);

    if (isSummary) {
      try {
        const summaryData = generateSummaryData(filteredWorks, groupingField);
        const sortedGroups = Object.keys(summaryData.groups).sort();
        const rows: any[] = [];

        // Header
        rows.push([
          'S.No.',
          groupingLabel,
          'Total No. of NIT Published',
          'Total No. of Tender',
          'Total No. of bids for which part-1',
          'Total No. of bids for which part-2',
          'Total No of Bids for which LOI',
          'Total No. of Agreement Signed',
          'Work Started'
        ]);

        let srNo = 1;
        sortedGroups.forEach((groupName) => {
          const groupData = summaryData.groups[groupName];
          const categories = Object.keys(groupData.categories).sort();

          // Group Header Row
          rows.push([srNo++, groupName, '', '', '', '', '', '', '']);

          // Categories
          categories.forEach((category, index) => {
            const catData = groupData.categories[category];
            rows.push([
              index + 1,
              category,
              catData.nitPublished,
              catData.tender,
              catData.part1,
              catData.part2,
              catData.loi,
              catData.agreementSigned,
              catData.workStarted
            ]);
          });

          // Group Total
          rows.push([
            '',
            'Total',
            groupData.totals.nitPublished,
            groupData.totals.tender,
            groupData.totals.part1,
            groupData.totals.part2,
            groupData.totals.loi,
            groupData.totals.agreementSigned,
            groupData.totals.workStarted
          ]);
        });

        // Grand Total
        rows.push([
          '',
          `Grand Total of ${officeName}`, // Use officeName here as well
          summaryData.grandTotal.nitPublished,
          summaryData.grandTotal.tender,
          summaryData.grandTotal.part1,
          summaryData.grandTotal.part2,
          summaryData.grandTotal.loi,
          summaryData.grandTotal.agreementSigned,
          summaryData.grandTotal.workStarted
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary Report");
        XLSX.writeFile(wb, `UPPCL-Summary-${new Date().toISOString().split('T')[0]}.xlsx`);
        setMessage("Export successful!");
        setOpen(false);
      } catch (error) {
        console.error("Export failed:", error);
        setMessage("Export failed");
      }
      return;
    }

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

  // If summary, render a direct button instead of column selector
  if (isSummary) {
    return (
      <div className="relative flex flex-col items-start">
        <Button
          onClick={() => handleExport()}
          variant="outline"
          size="sm"
          className="border-slate-200 hover:bg-slate-50 flex items-center rounded-full text-xs sm:text-sm px-2 sm:px-3"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Export Summary Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>
        {message && (
          <div className={`mt-2 text-xs p-2 rounded border absolute top-full left-0 z-50 w-48 ${message.startsWith('Error') || message === 'Export failed'
            ? 'text-red-700 bg-red-50 border-red-200'
            : 'text-green-700 bg-green-50 border-green-200'
            }`}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-200 hover:bg-slate-50 flex items-center rounded-full text-xs sm:text-sm px-2 sm:px-3"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Export to Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
          <DialogDescription>
            Select columns to include in the Excel report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Columns</div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs">Select All</Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs">Clear</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
            {ALL_COLUMNS.map((col) => (
              <div key={col} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`excel-col-${col}`}
                  checked={selectedColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`excel-col-${col}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                  title={col}
                >
                  {col.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {message && (
            <div className={`text-xs p-2 rounded border flex-1 text-center sm:text-left ${message.startsWith('Error')
              ? 'text-red-700 bg-red-50 border-red-200'
              : 'text-green-700 bg-green-50 border-green-200'
              }`}>
              {message}
            </div>
          )}
          <div className="flex gap-2 justify-end w-full sm:w-auto">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleExport()} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
