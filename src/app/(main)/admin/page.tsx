// src/app/admin/page.tsx
import { Shield, Settings, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
          <p className="text-slate-600">
            Manage the application from here.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Create, edit, and manage user accounts and their roles.
          </p>
          <a href="/admin/users" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Manage Users →
          </a>
        </div>
        
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Configure external services and system-wide settings.
          </p>
          <a href="/admin/settings" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Configure Settings →
          </a>
        </div>
      </div>
      
      {/* Future dashboard widgets will be added here */}
    </div>
  );
}