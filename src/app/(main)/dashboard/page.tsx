// src/app/(main)/dashboard/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExportToExcelButton } from "@/components/custom/ExportToExcelButton";
import { AlertTriangle } from "lucide-react";

type Work = {
  id: number;
  work_name: string | null;
  district_name: string | null;
  progress_percentage: number | null;
  wbs_code: string;
  is_blocked: boolean;
};

const roleToColumnMap: { [key: string]: string } = {
    'je': 'je_name',
    'division_head': 'division_name',
    'circle_head': 'circle_name',
    'zone_head': 'zone_name',
};

export default async function DashboardPage() {
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return redirect("/login"); }

  const { data: profile } = await supabase.from("profiles").select("role, value").eq("id", user.id).single();
  if (!profile) { return <p className="p-4 text-red-500">आपकी प्रोफाइल नहीं मिली।</p>; }

  let worksQuery = supabase.from("works").select("id, work_name, district_name, progress_percentage, wbs_code, is_blocked");
  const filterColumn = roleToColumnMap[profile.role];
  if (profile.role !== 'superadmin' && filterColumn && profile.value) {
    worksQuery = worksQuery.eq(filterColumn, profile.value);
  }
  
  const { data: works, error: worksError } = await worksQuery;
  if (worksError) { return <p className="p-4 text-red-500">कार्यों को लाने में असमर्थ: {worksError.message}</p>; }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>मेरा डैशबोर्ड</CardTitle>
            <CardDescription>
              आपको सौंपे गए सभी कार्यों की सूची। आपकी भूमिका: <Badge>{profile.role}</Badge>
            </CardDescription>
          </div>
          <ExportToExcelButton />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WBS कोड</TableHead>
                <TableHead>कार्य का नाम</TableHead>
                <TableHead>जिला</TableHead>
                <TableHead className="text-right">प्रगति (%)</TableHead>
              </TableRow>
            </TableHeader>{/* --- यहाँ बदलाव किया गया है --- */}
            <TableBody>
              {works && works.length > 0 ? (
                works.map((work: Work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.wbs_code}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {work.is_blocked && (
                                <span title="यह कार्य रुका हुआ है">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                </span>
                            )}
                            <Link href={`/dashboard/work/${work.id}`} className="hover:underline text-blue-600">
                                {work.work_name}
                            </Link>
                        </div>
                    </TableCell>
                    <TableCell>{work.district_name}</TableCell>
                    <TableCell className="text-right">{work.progress_percentage}%</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    आपको कोई कार्य नहीं सौंपा गया है।
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}