// src/app/admin/users/page.tsx
import { EditUserDialog } from "@/components/custom/EditUserDialog";
import { AddUserDialog } from "@/components/custom/AddUserDialog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";

// Profile के लिए टाइप परिभाषा
type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  value: string | null;
};

// दोनों को मिलाकर एक नया टाइप बनाएं
type UserWithProfile = {
  auth: User;
  profile: Profile | null;
};

export default async function UsersPage() {
  // createSupabaseServerClient को await करें और फिर client/admin को डिस्ट्रक्चर करें
  const { admin: supabaseAdmin, client: supabaseClient } = await createSupabaseServerClient();
  
  // एडमिन क्लाइंट का उपयोग करके सभी यूज़र्स को लाएं
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error fetching users:", authError);
    return <p className="p-4 text-red-500">यूज़र्स को लाने में असमर्थ।</p>;
  }

  // सामान्य क्लाइंट का उपयोग करके सभी प्रोफाइल लाएं
  const { data: profiles, error: profileError } = await supabaseClient
    .from("profiles")
    .select("*");
  
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return <p className="p-4 text-red-500">प्रोफाइल लाने में असमर्थ: {profileError.message}</p>;
  }

  // यूज़र्स और प्रोफाइल को उनकी ID के आधार पर मिलाएं
  const usersWithProfiles: UserWithProfile[] = users.map((user: User) => { // user का टाइप यहाँ स्पष्ट करें
    const profile = profiles.find((p: Profile) => p.id === user.id) || null;
    return {
      auth: user,
      profile: profile,
    };
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">यूज़र मैनेजमेंट</h1>
        <AddUserDialog />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ईमेल</TableHead>
              <TableHead>पूरा नाम</TableHead>
              <TableHead>भूमिका (Role)</TableHead>
              <TableHead>मान (Value)</TableHead>
              <TableHead className="text-right">एक्शन</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithProfiles.map(({ auth, profile }) => (
              <TableRow key={auth.id}>
                <TableCell>{auth.email}</TableCell>
                <TableCell>{profile?.full_name || 'N/A'}</TableCell>
                <TableCell>
                  {profile?.role && (
                    <Badge variant={profile.role === 'superadmin' ? 'destructive' : 'secondary'}>
                      {profile.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{profile?.value || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <EditUserDialog user={{
                    id: auth.id,
                    email: auth.email,
                    profile: profile
                  }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}