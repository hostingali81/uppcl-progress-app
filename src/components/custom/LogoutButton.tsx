// src/components/custom/LogoutButton.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";

export default function LogoutButton() {
  const signOut = async () => {
    "use server";
    const { client: supabase } = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return redirect("/login");
  };

  return <form action={signOut}><Button type="submit">लॉगआउट</Button></form>;
}