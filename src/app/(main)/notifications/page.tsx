import { NotificationsSection } from "@/components/custom/NotificationsSection";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Bell className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Notifications</h1>
          <p className="text-slate-600">Stay updated on discussions and mentions</p>
        </div>
      </div>

      {/* Notifications Content */}
      <NotificationsSection />
    </div>
  );
}
