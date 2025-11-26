import { useMemo, Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Work } from "@/lib/types";
import { generateSummaryData } from "@/lib/reportUtils";

interface SummaryReportTableProps {
  works: Work[];
  groupingField?: keyof Work;
  groupingLabel?: string;
}

export function SummaryReportTable({ works, groupingField = 'civil_zone', groupingLabel = 'Zone Name' }: SummaryReportTableProps) {
  const summaryData = useMemo(() => {
    return generateSummaryData(works, groupingField);
  }, [works, groupingField]);

  const sortedGroups = Object.keys(summaryData.groups).sort();

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg font-semibold text-slate-900">Summary Report</CardTitle>
        <CardDescription>
          Aggregated view of works by {groupingLabel} and Category
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-900 border-r w-[50px]">S.No.</TableHead>
              <TableHead className="font-bold text-slate-900 border-r min-w-[200px]">{groupingLabel}</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No. of NIT Published</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No. of Tender</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No. of bids for which part-1</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No. of bids for which part-2</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No of Bids for which LOI</TableHead>
              <TableHead className="font-bold text-slate-900 text-center border-r">Total No. of Agreement Signed</TableHead>
              <TableHead className="font-bold text-slate-900 text-center">Work Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map((groupName, index) => {
              const groupData = summaryData.groups[groupName];
              const categories = Object.keys(groupData.categories).sort();

              return (
                <Fragment key={groupName}>
                  {/* Group Header Row */}
                  <TableRow className="bg-slate-100 font-semibold">
                    <TableCell className="border-r text-center">{index + 1}</TableCell>
                    <TableCell className="border-r" colSpan={8}>{groupName}</TableCell>
                  </TableRow>

                  {/* Category Rows */}
                  {categories.map((category, catIndex) => (
                    <TableRow key={`cat-${groupName}-${category}`} className="hover:bg-slate-50">
                      <TableCell className="border-r text-center text-slate-500">{catIndex + 1}</TableCell>
                      <TableCell className="border-r pl-8">{category}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].nitPublished}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].tender}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].part1}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].part2}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].loi}</TableCell>
                      <TableCell className="border-r text-center">{groupData.categories[category].agreementSigned}</TableCell>
                      <TableCell className="text-center">{groupData.categories[category].workStarted}</TableCell>
                    </TableRow>
                  ))}

                  {/* Group Total Row */}
                  <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <TableCell className="border-r"></TableCell>
                    <TableCell className="border-r text-right pr-4">Total</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.nitPublished}</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.tender}</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.part1}</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.part2}</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.loi}</TableCell>
                    <TableCell className="border-r text-center">{groupData.totals.agreementSigned}</TableCell>
                    <TableCell className="text-center">{groupData.totals.workStarted}</TableCell>
                  </TableRow>
                </Fragment>
              );
            })}

            {/* Grand Total Row */}
            <TableRow className="bg-slate-900 text-white font-bold text-base">
              <TableCell className="border-r border-slate-700"></TableCell>
              <TableCell className="border-r border-slate-700 text-right pr-4">Grand Total of {groupingLabel}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.nitPublished}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.tender}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.part1}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.part2}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.loi}</TableCell>
              <TableCell className="border-r border-slate-700 text-center">{summaryData.grandTotal.agreementSigned}</TableCell>
              <TableCell className="text-center">{summaryData.grandTotal.workStarted}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
