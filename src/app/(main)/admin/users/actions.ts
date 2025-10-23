// src/app/admin/users/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function addUser(formData: FormData) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: "Server configuration error: Missing environment variables" };
    }

    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;
    const role = formData.get("role") as string;
    const value = formData.get("value") as string;

    if (!email || !password || !fullName || !role) {
      return { error: "Missing required fields: email, password, full name, and role are required" };
    }

    if (role !== 'superadmin' && !value) {
      return { error: "Value is required for this role" };
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseServiceRole.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(u => u.email === email);
    
    if (userExists) {
      return { error: "User with this email already exists" };
    }

    const { data: { user }, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return { error: `Auth Error: ${authError.message}` };
    }

    if (!user) {
      return { error: "Could not create user." };
    }
    
    // Use upsert to handle both insert and update cases
    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        role: role,
        value: value || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      // Clean up the auth user if profile creation fails
      await supabaseServiceRole.auth.admin.deleteUser(user.id);
      return { error: `Profile Error: ${profileError.message}` };
    }

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function updateUser(formData: FormData) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: "Server configuration error: Missing environment variables" };
    }

    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const id = formData.get("id") as string;
    const fullName = formData.get("full_name") as string;
    const role = formData.get("role") as string;
    const value = formData.get("value") as string;

    if (!id) {
      return { error: "User ID is missing." };
    }

    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .update({
        full_name: fullName,
        role: role,
        value: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (profileError) {
      return { error: `Profile Error: ${profileError.message}` };
    }

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Get unique values for a specific role from works table
export async function deleteUser(formData: FormData) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: "Server configuration error: Missing environment variables" };
    }

    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const userId = formData.get("userId") as string;

    if (!userId) {
      return { error: "User ID is missing." };
    }

    // Check if user exists
    const { data: { users }, error: usersError } = await supabaseServiceRole.auth.admin.listUsers();
    if (usersError) {
      return { error: `Failed to fetch users: ${usersError.message}` };
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      return { error: "User not found." };
    }

    // Prevent superadmin from deleting themselves
    const { data: { user: currentUser } } = await supabaseServiceRole.auth.getUser();
    if (currentUser && currentUser.id === userId) {
      return { error: "You cannot delete your own account." };
    }

    // Delete profile first
    const { error: profileError } = await supabaseServiceRole
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      return { error: `Profile deletion failed: ${profileError.message}` };
    }

    // Delete auth user
    const { error: authError } = await supabaseServiceRole.auth.admin.deleteUser(userId);

    if (authError) {
      return { error: `Auth user deletion failed: ${authError.message}` };
    }

    revalidatePath("/admin/users");
    return { error: null };
  } catch (error) {
    return { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getRoleValues(role: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { values: [] };
  }

  const supabaseServiceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  
  let columnName = '';
  
  // Map role to database column
  switch (role) {
    case 'je':
      columnName = 'je_name';
      break;
    case 'sub_division_head':
      columnName = 'sub_division_name';
      break;
    case 'division_head':
      columnName = 'division_name';
      break;
    case 'circle_head':
      columnName = 'circle_name';
      break;
    case 'zone_head':
      columnName = 'zone_name';
      break;
    default:
      return { values: [] };
  }
  
  try {
    const { data, error } = await supabaseServiceRole
      .from("works")
      .select(columnName)
      .not(columnName, 'is', null)
      .neq(columnName, '');
    
    if (error) {
      return { values: [] };
    }
    
    // Extract unique values
    const uniqueValues = [...new Set(data.map(item => (item as any)[columnName]).filter(Boolean))];
    
    return { values: uniqueValues };
  } catch (error) {
    return { values: [] };
  }
}