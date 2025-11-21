// @ts-nocheck
// src/app/admin/users/page.tsx

import { EditUserDialog } from "@/components/custom/EditUserDialog";
import { AddUserDialog } from "@/components/custom/AddUserDialog";
import { DeleteUserDialog } from "@/components/custom/DeleteUserDialog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Users, Shield } from "lucide-react";

// Define a clear type for a user's profile data.
type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  region: string | null;
  division: string | null;
  subdivision: string | null;
  circle: string | null;
  zone: string | null;
};

// Combine Auth and Profile data into a single type for convenience.
type UserWithProfile = {
  auth: User;
  profile: Profile | null;
};

// Helper function to get the appropriate value for display based on role
function getProfileValue(profile: Profile | null): string {
  if (!profile) return 'N/A';

  switch (profile.role) {
    case 'je':
      return profile.region || 'N/A';
    case 'sub_division_head':
      return profile.subdivision || 'N/A';
    case 'division_head':
      return profile.division || 'N/A';
    case 'circle_head':
      return profile.circle || 'N/A';
    case 'zone_head':
      return profile.zone || 'N/A';
    case 'superadmin':
      return 'Super Admin';
    default:
      return 'N/A';
  }
}

export default async function UsersPage() {
  // Data fetching logic remains identical.
  const { admin: supabaseAdmin, client: supabaseClient } = await createSupabaseServerClient();
  
  // Get current user to prevent self-deletion
  const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
  
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    return <p className="p-4 text-red-500">Failed to fetch users.</p>;
  }

  const { data: profiles, error: profileError } = await supabaseAdmin.from("profiles").select("id, full_name, role, region, division, subdivision, circle, zone");
  if (profileError) {
    return <p className="p-4 text-red-500">Failed to fetch profiles: {profileError.message}</p>;
  }

  // Join users and profiles based on their ID.
  const usersWithProfiles: UserWithProfile[] = users.map((user: User) => {
    const profile = profiles.find((p: Profile) => p.id === user.id) || null;
    return {
      auth: user,
      profile: profile,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Create, view, and manage all user accounts in the system</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">All Users</CardTitle>
              <CardDescription className="mt-1 text-slate-600">
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0">
              {/* The "Add User" dialog trigger is styled as a primary action button. */}
              <AddUserDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="font-semibold text-slate-900">Email</TableHead>
                  <TableHead className="font-semibold text-slate-900">Full Name</TableHead>
                  <TableHead className="font-semibold text-slate-900">Role</TableHead>
                  <TableHead className="font-semibold text-slate-900">Value</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithProfiles.map(({ auth, profile }) => (
                  <TableRow key={auth.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-mono text-sm text-slate-700">{auth.email}</TableCell>
                    <TableCell className="text-slate-700">{profile?.full_name || 'N/A'}</TableCell>
                    <TableCell>
                      {profile?.role && (
                        // Use a destructive badge for the high-privilege superadmin role.
                        <Badge 
                          variant={profile.role === 'superadmin' ? 'destructive' : 'secondary'}
                          className={profile.role === 'superadmin' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                        >
                          {profile.role === 'superadmin' && <Shield className="h-3 w-3 mr-1" />}
                          {profile.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">{getProfileValue(profile)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditUserDialog user={{
                          id: auth.id,
                          email: auth.email,
                          profile: profile ? {
                            full_name: profile.full_name,
                            role: profile.role,
                            value: getProfileValue(profile) === 'Super Admin' ? null : getProfileValue(profile) === 'N/A' ? null : getProfileValue(profile).replace('Super Admin', '').replace('N/A', '')
                          } : null
                        }} />
                        {/* Only show delete button if not current user */}
                        {currentUser && currentUser.id !== auth.id && (
                          <DeleteUserDialog user={{
                            id: auth.id,
                            email: auth.email,
                            profile: profile ? {
                              full_name: profile.full_name,
                              role: profile.role,
                              value: getProfileValue(profile) === 'Super Admin' ? null : getProfileValue(profile) === 'N/A' ? null : getProfileValue(profile).replace('Super Admin', '').replace('N/A', '')
                            } : null
                          }} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
