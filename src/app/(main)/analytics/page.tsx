// src/app/(main)/analytics/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsCharts } from "@/components/custom/AnalyticsCharts";

type Work = {
  progress_percentage: number | null;
  division_name: string | null;
};

// --- बदलाव यहाँ है ---
// यह मैप हमें बताएगा कि किस भूमिका के लिए किस कॉलम को फ़िल्टर करना है
const roleToColumnMap: { [key: string]: string } = {
  'je': 'je_name',
  'division_head': 'division_name',
  'circle_head': 'circle_name',
  'zone_head': 'zone_name',
};
// --- बदलाव समाप्त ---

export default async function AnalyticsPage() {
  const { client: supabase } = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }
  
  // --- बदलाव यहाँ है ---
  // अब हम 'value' भी प्राप्त करेंगे
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, value") 
    .eq("id", user.id)
    .single();

  if (!profile) {
    return <p className="p-8 text-red-500">आपकी प्रोफाइल नहीं मिली।</p>;
  }
  
  // डेटाबेस क्वेरी तैयार करें
  let worksQuery = supabase.from("works").select("progress_percentage, division_name");
  
  // यदि उपयोगकर्ता सुपर एडमिन नहीं है, तो क्वेरी को फ़िल्टर करें
  const filterColumn = roleToColumnMap[profile.role];
  if (profile.role !== 'superadmin' && filterColumn && profile.value) {
    worksQuery = worksQuery.eq(filterColumn, profile.value);
  }

  const { data: works, error } = await worksQuery;
  // --- बदलाव समाप्त ---

  if (error) {
    return <p className="p-8 text-red-500">एनालिटिक्स डेटा लाने में असमर्थ: {error.message}</p>;
  }

  if (!works || works.length === 0) {
     return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">एनालिटिक्स डैशबोर्ड</h1>
            <p>विश्लेषण के लिए कोई डेटा उपलब्ध नहीं है।</p>
        </div>
     );
  }
  
  const statusData = (works as Work[]).reduce(
    (acc, work) => {
      const progress = work.progress_percentage || 0;
      if (progress === 100) acc[0].value += 1;
      else if (progress > 0) acc[1].value += 1;
      else acc[2].value += 1;
      return acc;
    },
    [
      { name: 'पूरे हो चुके', value: 0 },
      { name: 'चल रहे', value: 0 },
      { name: 'शुरू नहीं हुए', value: 0 },
    ]
  );
  
  const divisionCounts = (works as Work[]).reduce((acc, work) => {
    const division = work.division_name || 'N/A';
    if (!acc[division]) acc[division] = 0;
    acc[division]++;
    return acc;
  }, {} as Record<string, number>);

  const divisionData = Object.keys(divisionCounts).map(name => ({ name, total: divisionCounts[name] }));

  return (
    <div className="p-4 md:p-8 space-y-6">
       <h1 className="text-3xl font-bold">एनालिटिक्स डैशबोर्ड</h1>
      <AnalyticsCharts 
        statusData={statusData}
        divisionData={divisionData}
      />
    </div>
  );
}