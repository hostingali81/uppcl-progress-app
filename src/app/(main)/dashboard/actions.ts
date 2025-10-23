// src/app/(main)/dashboard/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

// This map tells us which column to filter for which role
const roleToColumnMap: { [key: string]: string } = {
  'je': 'je_name',
  'division_head': 'division_name',
  'circle_head': 'circle_name',
  'zone_head': 'zone_name',
};

export async function exportToExcel() {
  try {
    const { client: supabase } = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { throw new Error("Authentication required."); }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, value")
      .eq("id", user.id)
      .single();

    if (!profile) { throw new Error("Profile not found."); }

    // Prepare database query same as dashboard
    let worksQuery = supabase.from("works").select("*"); // Select all columns

    const filterColumn = roleToColumnMap[profile.role];
    if (profile.role !== 'superadmin' && filterColumn && profile.value) {
      worksQuery = worksQuery.eq(filterColumn, profile.value);
    }

    const { data: works, error } = await worksQuery;
    if (error) { throw new Error(`Database error: ${error.message}`); }
    if (!works || works.length === 0) {
      return { error: "No data available for export." };
    }

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(works);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Works");

    // Write file to buffer and then convert to Base64 string
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const base64Data = buffer.toString("base64");
    
    // Create file name
    const fileName = `Pragati-Works-Export-${new Date().toISOString().split('T')[0]}.xlsx`;

    return { success: { data: base64Data, fileName: fileName } };

  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}