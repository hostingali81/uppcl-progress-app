import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/app/(main)/dashboard/actions";
import { Download, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
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
  isDynamicPivot?: boolean;
}

// All available columns (authoritative list)
const ALL_COLUMNS = [
  'id', 'scheme_name', 'zone_name', 'circle_name', 'division_name', 'sub_division_name', 'district_name', 'je_name',
  'work_category', 'wbs_code', 'work_name', 'sanction_amount_lacs', 'boq_amount', 'agreement_amount', 'rate_as_per_ag',
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

export function ExportToExcelButton({ selectedScheme, filteredWorks, isSummary, groupingField = 'civil_zone', groupingLabel = 'Zone Name', schemeName = 'All Schemes', officeName = 'UPPCL', userId, isDynamicPivot }: ExportToExcelButtonProps) {
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

  const handleExport = async (cols?: string[]) => {
    setMessage(null);

    // Define interface for dynamic export data
    interface DynamicExportData {
      primaryGroupLabel: string;
      secondaryGroupLabel: string;
      enableSecondaryGroup: boolean;
      selectedMetrics: string[];
      summaryData: {
        groups: Record<string, any>;
        grandTotal: any;
      };
      sortedPrimaryGroups: string[];
    }

    // Handle Dynamic Pivot Export
    if (isDynamicPivot) {
      const dynamicExportData = (window as any).__dynamicReportExportData as DynamicExportData;
      if (!dynamicExportData) {
        setMessage("Export data not ready");
        return;
      }

      try {
        const { primaryGroupLabel, secondaryGroupLabel, enableSecondaryGroup, selectedMetrics, summaryData, sortedPrimaryGroups } = dynamicExportData;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Dynamic Pivot Report');

        worksheet.pageSetup = {
          paperSize: 9,
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        };

        // Title
        const titleColSpan = 2 + selectedMetrics.length;
        worksheet.mergeCells(1, 1, 1, titleColSpan);
        const titleCell = worksheet.getCell(1, 1);
        titleCell.value = `Dynamic Pivot Report - ${schemeName}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Subtitle
        worksheet.mergeCells(2, 1, 2, titleColSpan);
        const subtitleCell = worksheet.getCell(2, 1);
        subtitleCell.value = `${officeName} - Generated on ${new Date().toLocaleDateString('en-IN')}`;
        subtitleCell.font = { size: 11 };
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Headers
        const headerRow = worksheet.getRow(4);
        headerRow.getCell(1).value = 'S.No.';
        headerRow.getCell(2).value = enableSecondaryGroup ? `${primaryGroupLabel} / ${secondaryGroupLabel}` : primaryGroupLabel;

        selectedMetrics.forEach((metric, idx) => {
          const metricLabel = dynamicExportData.selectedMetrics.includes(metric)
            ? (metric === 'count' ? 'Total Works Count' :
              metric === 'nitPublished' ? 'NIT Published' :
                metric === 'tender' ? 'Tender Count' :
                  metric === 'part1' ? 'Part-1 Opening' :
                    metric === 'part2' ? 'Part-2 Opening' :
                      metric === 'loi' ? 'LOI Issued' :
                        metric === 'agreementSigned' ? 'Agreement Signed' :
                          metric === 'workStarted' ? 'Work Started' :
                            metric === 'completed' ? 'Completed (100%)' :
                              metric === 'inProgress' ? 'In Progress' :
                                metric === 'notStarted' ? 'Not Started' :
                                  metric === 'blocked' ? 'Blocked/High Priority' :
                                    metric === 'avgProgress' ? 'Avg Progress %' :
                                      metric === 'totalSanction' ? 'Total Sanction (Lacs)' :
                                        metric === 'totalAgreement' ? 'Total Agreement Amount' :
                                          metric === 'totalBOQ' ? 'Total BOQ Amount' : metric)
            : metric;
          headerRow.getCell(3 + idx).value = metricLabel;
        });

        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        let currentRow = 5;
        let srNo = 1;

        sortedPrimaryGroups.forEach((primaryKey) => {
          const groupData = summaryData.groups[primaryKey];

          // Primary row
          const primaryRow = worksheet.getRow(currentRow);
          primaryRow.getCell(1).value = srNo++;
          primaryRow.getCell(2).value = primaryKey;
          selectedMetrics.forEach((metric, idx) => {
            primaryRow.getCell(3 + idx).value = groupData.metrics[metric];
          });
          primaryRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          });
          currentRow++;

          // Secondary rows
          if (enableSecondaryGroup) {
            const secondaryKeys = Object.keys(groupData.secondary).sort();
            secondaryKeys.forEach((secondaryKey, secIdx) => {
              const secRow = worksheet.getRow(currentRow);
              secRow.getCell(1).value = `${srNo - 1}.${secIdx + 1}`;
              secRow.getCell(2).value = `  ${secondaryKey}`;
              selectedMetrics.forEach((metric, idx) => {
                secRow.getCell(3 + idx).value = groupData.secondary[secondaryKey].metrics[metric];
              });
              secRow.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
              });
              currentRow++;
            });
          }
        });

        // Grand Total
        const grandRow = worksheet.getRow(currentRow);
        grandRow.getCell(1).value = '';
        grandRow.getCell(2).value = 'Grand Total';
        selectedMetrics.forEach((metric, idx) => {
          grandRow.getCell(3 + idx).value = summaryData.grandTotal.metrics[metric];
        });
        grandRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Column widths
        worksheet.getColumn(1).width = 8;
        worksheet.getColumn(2).width = 30;
        for (let i = 0; i < selectedMetrics.length; i++) {
          worksheet.getColumn(3 + i).width = 15;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Dynamic-Pivot-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setMessage("Export successful!");
        setOpen(false);
      } catch (error) {
        console.error("Export failed:", error);
        setMessage("Export failed");
      }
      return;
    }

    if (isSummary) {
      try {
        const summaryData = generateSummaryData(filteredWorks, groupingField);
        const sortedGroups = Object.keys(summaryData.groups).sort();

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Summary Report');

        // Set page setup for A4 printing
        worksheet.pageSetup = {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            left: 0.25,
            right: 0.25,
            top: 0.75,
            bottom: 0.75,
            header: 0.3,
            footer: 0.3
          }
        };

        // Add Title Row
        worksheet.mergeCells('A1:I1');
        const titleRow = worksheet.getRow(1);
        titleRow.getCell(1).value = `Progress Report of Civil Work of "${schemeName}"`;
        titleRow.getCell(1).font = { bold: true, size: 14 };
        titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

        // Add Subtitle Row
        worksheet.mergeCells('A2:I2');
        const subtitleRow = worksheet.getRow(2);
        subtitleRow.getCell(1).value = `under ${officeName}, DVVNL, Agra`;
        subtitleRow.getCell(1).font = { bold: true, size: 12 };
        subtitleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

        // Add Date Row
        worksheet.mergeCells('A3:I3');
        const dateRow = worksheet.getRow(3);
        dateRow.getCell(1).value = `Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        dateRow.getCell(1).font = { size: 10 };
        dateRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

        // Empty rows (auto height)

        // Table Header (Row 6)
        const headerRow = worksheet.getRow(6);
        const headers = [
          'S.No.',
          groupingLabel,
          'Total No. of NIT Published',
          'Total No. of Tender',
          'Total No. of bids for which part-1',
          'Total No. of bids for which part-2',
          'Total No of Bids for which LOI',
          'Total No. of Agreement Signed',
          'Work Started'
        ];

        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' } // Blue color
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        let currentRow = 7;
        let srNo = 1;

        sortedGroups.forEach((groupName) => {
          const groupData = summaryData.groups[groupName];
          const categories = Object.keys(groupData.categories).sort();

          // Group Header Row
          const groupRow = worksheet.getRow(currentRow);
          groupRow.getCell(1).value = srNo++;
          groupRow.getCell(2).value = groupName;
          for (let i = 3; i <= 9; i++) {
            groupRow.getCell(i).value = '';
          }
          groupRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          currentRow++;

          // Categories
          categories.forEach((category, index) => {
            const catData = groupData.categories[category];
            const catRow = worksheet.getRow(currentRow);
            catRow.getCell(1).value = index + 1;
            catRow.getCell(2).value = category;
            catRow.getCell(3).value = catData.nitPublished;
            catRow.getCell(4).value = catData.tender;
            catRow.getCell(5).value = catData.part1;
            catRow.getCell(6).value = catData.part2;
            catRow.getCell(7).value = catData.loi;
            catRow.getCell(8).value = catData.agreementSigned;
            catRow.getCell(9).value = catData.workStarted;

            catRow.eachCell((cell) => {
              cell.alignment = { vertical: 'middle' };
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
            currentRow++;
          });

          // Group Total
          const totalRow = worksheet.getRow(currentRow);
          totalRow.getCell(1).value = '';
          totalRow.getCell(2).value = 'Total';
          totalRow.getCell(3).value = groupData.totals.nitPublished;
          totalRow.getCell(4).value = groupData.totals.tender;
          totalRow.getCell(5).value = groupData.totals.part1;
          totalRow.getCell(6).value = groupData.totals.part2;
          totalRow.getCell(7).value = groupData.totals.loi;
          totalRow.getCell(8).value = groupData.totals.agreementSigned;
          totalRow.getCell(9).value = groupData.totals.workStarted;

          totalRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
          currentRow++;
        });

        // Grand Total
        const grandTotalRow = worksheet.getRow(currentRow);
        grandTotalRow.getCell(1).value = '';
        grandTotalRow.getCell(2).value = `Grand Total of ${officeName}`;
        grandTotalRow.getCell(3).value = summaryData.grandTotal.nitPublished;
        grandTotalRow.getCell(4).value = summaryData.grandTotal.tender;
        grandTotalRow.getCell(5).value = summaryData.grandTotal.part1;
        grandTotalRow.getCell(6).value = summaryData.grandTotal.part2;
        grandTotalRow.getCell(7).value = summaryData.grandTotal.loi;
        grandTotalRow.getCell(8).value = summaryData.grandTotal.agreementSigned;
        grandTotalRow.getCell(9).value = summaryData.grandTotal.workStarted;

        grandTotalRow.eachCell((cell) => {
          cell.font = { bold: true };
          cell.alignment = { vertical: 'middle' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD9E1F2' } // Light blue
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Set column widths
        worksheet.getColumn(1).width = 8;  // S.No.
        worksheet.getColumn(2).width = 30; // Grouping
        worksheet.getColumn(3).width = 15; // NIT
        worksheet.getColumn(4).width = 15; // Tender
        worksheet.getColumn(5).width = 15; // Part 1
        worksheet.getColumn(6).width = 15; // Part 2
        worksheet.getColumn(7).width = 15; // LOI
        worksheet.getColumn(8).width = 15; // Agreement
        worksheet.getColumn(9).width = 15; // Started

        // Write file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `UPPCL-Summary-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

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
      const result = await exportToExcel(filteredWorks, colsToSend, schemeName, officeName);
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
