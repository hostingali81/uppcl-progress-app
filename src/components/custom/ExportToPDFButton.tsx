"use client";

import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateSummaryData } from "@/lib/reportUtils";

import type { Work } from "@/lib/types";

interface ExportToPDFButtonProps {
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

export function ExportToPDFButton({ selectedScheme, filteredWorks, isSummary, groupingField = 'civil_zone', groupingLabel = 'Zone Name', schemeName = 'All Schemes', officeName = 'UPPCL', userId }: ExportToPDFButtonProps) {
  const [isPending, startTransition] = useTransition();

  // Column selector state
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED.slice());

  // Load persisted columns on mount
  useEffect(() => {
    if (userId) {
      const savedCols = localStorage.getItem(`export_cols_pdf_${userId}`);
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
      localStorage.setItem(`export_cols_pdf_${userId}`, JSON.stringify(selectedColumns));
    }
  }, [selectedColumns, userId]);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const selectAll = () => setSelectedColumns(ALL_COLUMNS.slice());
  const clearAll = () => setSelectedColumns([]);

  const handleExport = () => {
    startTransition(async () => {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

      // Determine fonts
      const bodyFont = 'helvetica';
      const headerFont = 'helvetica';

      // Draw border around header
      doc.setDrawColor(41, 128, 185); // Blue border color
      doc.setLineWidth(0.5);
      // doc.rect(10, 8, doc.internal.pageSize.width - 20, 27, 'S'); // Border removed as per previous request

      // Enhanced Header (without border) - Use Helvetica
      doc.setFont(headerFont);
      doc.setFontSize(14);
      doc.text(`Progress Report of Civil Work of "${schemeName}"`, doc.internal.pageSize.width / 2, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`under ${officeName}, DVVNL, Agra`, doc.internal.pageSize.width / 2, 23, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 32);
      doc.setTextColor(0, 0, 0);

      if (isSummary) {
        const summaryData = generateSummaryData(filteredWorks, groupingField);
        const sortedGroups = Object.keys(summaryData.groups).sort();
        const tableBody: any[] = [];

        let srNo = 1;
        sortedGroups.forEach((groupName) => {
          const groupData = summaryData.groups[groupName];
          const categories = Object.keys(groupData.categories).sort();

          // Group Header Row
          tableBody.push([
            { content: srNo++, colSpan: 1, styles: { halign: 'center' } },
            { content: groupName, colSpan: 8, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
          ]);

          // Categories
          categories.forEach((category, index) => {
            const catData = groupData.categories[category];
            tableBody.push([
              { content: index + 1, styles: { halign: 'center' } },
              category,
              { content: catData.nitPublished, styles: { halign: 'center' } },
              { content: catData.tender, styles: { halign: 'center' } },
              { content: catData.part1, styles: { halign: 'center' } },
              { content: catData.part2, styles: { halign: 'center' } },
              { content: catData.loi, styles: { halign: 'center' } },
              { content: catData.agreementSigned, styles: { halign: 'center' } },
              { content: catData.workStarted, styles: { halign: 'center' } }
            ]);
          });

          // Group Total
          tableBody.push([
            { content: '', colSpan: 1 },
            { content: 'Total', styles: { fontStyle: 'bold' } },
            { content: groupData.totals.nitPublished, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.tender, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.part1, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.part2, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.loi, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.agreementSigned, styles: { fontStyle: 'bold', halign: 'center' } },
            { content: groupData.totals.workStarted, styles: { fontStyle: 'bold', halign: 'center' } }
          ]);
        });

        // Grand Total
        tableBody.push([
          { content: '', colSpan: 1 },
          { content: `Grand Total of ${officeName}`, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255] } },
          { content: summaryData.grandTotal.nitPublished, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.tender, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.part1, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.part2, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.loi, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.agreementSigned, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } },
          { content: summaryData.grandTotal.workStarted, styles: { fontStyle: 'bold', fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' } }
        ]);

        autoTable(doc, {
          startY: 37,
          margin: { top: 5, right: 5, bottom: 15, left: 5 }, // Increased bottom margin for footer
          head: [[
            'S. No.',
            groupingLabel,
            'Total No. of NIT Published',
            'Total No. of Tender',
            'Total No. of bids for which part-1 Opened',
            'Total No. of bids for which part-2 Opened',
            'Total No of Bids for which LOI Issued',
            'Total No. of Agreement Signed',
            'Work Started'
          ]],
          body: tableBody,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            minCellHeight: 10,
            lineWidth: 0.2,
            lineColor: [200, 200, 200],
            font: headerFont, // Use Helvetica for headers
            fontStyle: 'normal'
          },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.2,
            lineColor: [200, 200, 200],
            overflow: 'linebreak',
            font: 'helvetica', // Use Helvetica for Summary to ensure bold headers and English text render correctly
            fontStyle: 'normal'
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50, halign: 'left' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'center' }
          }
        });

        doc.save(`UPPCL-Summary-${new Date().toISOString().split('T')[0]}.pdf`);
        setOpen(false);
        return;
      }

      // Detailed Report Logic
      const tableColumn = selectedColumns.map(col => {
        // Format column headers nicely
        return col.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      });

      const tableRows: any[] = [];

      filteredWorks.forEach(work => {
        const workData = selectedColumns.map(col => {
          let val = (work as any)[col];

          // Handle fallbacks for specific columns if value is missing
          if (!val || val === '') {
            switch (col) {
              case 'zone_name': val = work.civil_zone; break;
              case 'circle_name': val = work.civil_circle; break;
              case 'division_name': val = work.civil_division; break;
              case 'sub_division_name': val = work.civil_sub_division; break;
              case 'teco_status': val = work.teco; break;
              case 'fico_status': val = work.fico; break;
              case 'updated_at': val = work.created_at; break;
            }
          }

          if ((col === 'updated_at' || (col.includes('date') && !col.includes('no_and_date'))) && val) {
            try {
              return new Date(val as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            } catch (e) {
              return val;
            }
          }
          return val || '-';
        });
        tableRows.push(workData);
      });

      autoTable(doc, {
        startY: 37,
        margin: { top: 5, right: 5, bottom: 15, left: 5 }, // Increased bottom margin for footer
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 8,
          halign: 'center',
          valign: 'middle',
          minCellHeight: 10,
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
          font: headerFont, // Use Helvetica for headers
          fontStyle: 'normal'
        },
        styles: {
          fontSize: 7,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
          overflow: 'linebreak',
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
          font: bodyFont, // Use Noto for body
          fontStyle: 'normal'
        },
        columnStyles: {
          // Find work_name and remark columns and set them to left align
          ...selectedColumns.reduce((acc, col, index) => {
            if (col === 'work_name' || col === 'remark') {
              acc[index] = { halign: 'left', cellWidth: 'auto' };
            }
            return acc;
          }, {} as any)
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont(headerFont); // Ensure footer uses Helvetica
          doc.text(`Page ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      doc.save(`UPPCL-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      setOpen(false);
    });
  };

  // If summary, render a direct button instead of dialog trigger
  if (isSummary) {
    return (
      <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3">
        <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Export Summary PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3">
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to PDF</DialogTitle>
          <DialogDescription>
            Select columns to include in the PDF report.
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
                  id={`col-${col}`}
                  checked={selectedColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`col-${col}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate"
                  title={col}
                >
                  {col.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
