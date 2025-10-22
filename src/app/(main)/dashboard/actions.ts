// src/app/(main)/dashboard/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

// यह मैप हमें बताएगा कि किस भूमिका के लिए किस कॉलम को फ़िल्टर करना है
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

    // डैशबोर्ड के समान ही डेटाबेस क्वेरी तैयार करें
    let worksQuery = supabase.from("works").select("*"); // सभी कॉलम चुनें

    const filterColumn = roleToColumnMap[profile.role];
    if (profile.role !== 'superadmin' && filterColumn && profile.value) {
      worksQuery = worksQuery.eq(filterColumn, profile.value);
    }

    const { data: works, error } = await worksQuery;
    if (error) { throw new Error(`Database error: ${error.message}`); }
    if (!works || works.length === 0) {
      return { error: "निर्यात करने के लिए कोई डेटा नहीं है।" };
    }

    // एक्सेल वर्कबुक बनाएँ
    const worksheet = XLSX.utils.json_to_sheet(works);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Works");

    // फाइल को बफर में लिखें और फिर Base64 स्ट्रिंग में बदलें
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const base64Data = buffer.toString("base64");
    
    // फाइल का नाम बनाएँ
    const fileName = `Pragati-Works-Export-${new Date().toISOString().split('T')[0]}.xlsx`;

    return { success: { data: base64Data, fileName: fileName } };

  } catch (error: any) {
    return { error: error.message };
  }
}