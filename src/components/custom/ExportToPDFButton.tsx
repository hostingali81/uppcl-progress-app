"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Work } from "@/lib/types";

interface ExportToPDFButtonProps {
  filteredWorks: Work[];
  selectedScheme: string;
}

const columnOptions = [
  { key: 'id', label: 'ID' },
  { key: 'scheme_name', label: 'Scheme Name' },
  { key: 'scheme_sr_no', label: 'Scheme Sr. No.' },
  { key: 'work_name', label: 'Name of Work' },
  { key: 'civil_zone', label: 'Civil Zone' },
  { key: 'civil_circle', label: 'Civil Circle' },
  { key: 'civil_division', label: 'Civil Division' },
  { key: 'civil_sub_division', label: 'Civil Sub-Division' },
  { key: 'district_name', label: 'District Name' },
  { key: 'je_name', label: 'JE Name' },
  { key: 'work_category', label: 'Work Category' },
  { key: 'site_name', label: 'Site Name' },
  { key: 'wbs_code', label: 'WBS Code' },
  { key: 'sanction_amount_lacs', label: 'Sanction Amount (Rs. Lacs)' },
  { key: 'tender_no', label: 'Tender No.' },
  { key: 'boq_amount', label: 'BoQ Amount' },
  { key: 'agreement_amount', label: 'Agreement Amount' },
  { key: 'rate_as_per_ag', label: 'Rate as per Ag.' },
  { key: 'nit_date', label: 'Date of NIT' },
  { key: 'part1_opening_date', label: 'Date of Part-I Opening' },
  { key: 'loi_no_and_date', label: 'LoI No. & Date' },
  { key: 'part2_opening_date', label: 'Date of Part-II Opening' },
  { key: 'agreement_no_and_date', label: 'Agreement No. & Date' },
  { key: 'firm_name_and_contact', label: 'Name of firm & Contact No.' },
  { key: 'firm_contact_no', label: 'Firm Contact No.' },
  { key: 'firm_email', label: 'Firm Email' },
  { key: 'start_date', label: 'Date of Start' },
  { key: 'scheduled_completion_date', label: 'Scheduled Date of Completion' },
  { key: 'actual_completion_date', label: 'Actual Date of Completion' },
  { key: 'weightage', label: 'Weightage' },
  { key: 'progress_percentage', label: 'Present Progress in %' },
  { key: 'remark', label: 'Remark' },
  { key: 'mb_status', label: 'MB Status' },
  { key: 'teco_status', label: 'TECO' },
  { key: 'fico_status', label: 'FICO' },
  { key: 'is_blocked', label: 'Is Blocked' },
  { key: 'blocker_remark', label: 'Blocker Remark' },
  { key: 'distribution_zone', label: 'Distribution Zone' },
  { key: 'distribution_circle', label: 'Distribution Circle' },
  { key: 'distribution_division', label: 'Distribution Division' },
  { key: 'distribution_sub_division', label: 'Distribution Sub-Division' },
  { key: 'bill_no', label: 'Bill No' },
  { key: 'bill_amount_with_tax', label: 'Bill Amount (Incl. Tax)' },
];

export function ExportToPDFButton({ filteredWorks, selectedScheme }: ExportToPDFButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['work_name', 'district_name', 'progress_percentage', 'scheme_name']);

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = () => {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text("UPPCL Progress Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Scheme: ${selectedScheme}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    const headers = selectedColumns.map(key =>
      columnOptions.find(col => col.key === key)?.label || key
    );

    const tableData = filteredWorks.map(work =>
      selectedColumns.map(key => {
        const value = work[key as keyof Work];
        if (key === 'progress_percentage') return `${value || 0}%`;
        return value || 'N/A';
      })
    );

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`UPPCL-Progress-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3">
          <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Export PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Columns for PDF Export</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedColumns(columnOptions.map(c => c.key))}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedColumns([])}
          >
            Unselect All
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto py-4">
          {columnOptions.map(col => (
            <label key={col.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="rounded"
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
