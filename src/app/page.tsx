// src/app/page.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // --- यह लाइन जोड़ी गई है ---
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowRight, GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // जांचें कि क्या उपयोगकर्ता पहले से लॉग इन है
  const { client: supabase } = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // यदि लॉग इन है, तो उसे सीधे डैशबोर्ड पर भेजें
  if (user) {
    return redirect("/dashboard");
  }

  // यदि लॉग इन नहीं है, तो लैंडिंग पेज दिखाएं
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* हेडर */}
      <header className="flex items-center justify-between p-4 px-6 border-b">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <GanttChartSquare className="h-7 w-7" />
          <span>प्रगति</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline">लॉग इन करें</Button>
          </Link>
        </nav>
      </header>

      {/* मुख्य सामग्री */}
      <main className="flex-1 flex items-center justify-center">
        <section className="text-center px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              कार्य प्रबंधन, सरल और प्रभावी
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
              अपने विभागीय कार्यों को एक ही स्थान पर प्रबंधित करें
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600">
              "प्रगति" के साथ ज़मीनी स्तर के अपडेट से लेकर शीर्ष-स्तरीय विश्लेषण तक,
              पूर्ण पारदर्शिता और वास्तविक समय में डेटा प्राप्त करें।
            </p>
            <div className="mt-10">
              <Link href="/login">
                <Button size="lg" className="group">
                  शुरू करें
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      {/* फुटर */}
      <footer className="py-6 px-6 border-t bg-gray-50">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} प्रगति प्लेटफॉर्म। सर्वाधिकार सुरक्षित।
        </p>
      </footer>
    </div>
  );
}