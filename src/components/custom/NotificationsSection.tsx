"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, MessageSquare, AtSign, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/(main)/profile/actions";
import { toast } from "sonner";

type Notification = {
  id: number;
  type: 'mention' | 'comment' | 'progress_update';
  message: string;
  is_read: boolean;
  created_at: string;
  work_id: number;
  comment_id?: number;
};

interface NotificationsSectionProps {
  notifications?: Notification[] | null;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'mention':
      return <AtSign className="h-4 w-4 text-blue-600" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4 text-green-600" />;
    case 'progress_update':
      return <Bell className="h-4 w-4 text-orange-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-600" />;
  }
}

function getNotificationBadge(type: string) {
  switch (type) {
    case 'mention':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Mention</Badge>;
    case 'comment':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Comment</Badge>;
    case 'progress_update':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Update</Badge>;
    default:
      return <Badge variant="outline">Notification</Badge>;
  }
}

export function NotificationsSection({ notifications: initialNotifications }: NotificationsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications || []);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Fetch notifications client-side to avoid hydration issues
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch notifications:', error);
        setLoading(false);
      });
  }, []);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const filteredNotifications = showUnreadOnly
    ? notifications?.filter(n => !n.is_read) || []
    : notifications || [];

  // Show only first 4 notifications by default, or all if showAll is true
  const displayedNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 4);
  const hasMoreNotifications = filteredNotifications.length > 4;

  const handleMarkAsRead = async (notificationId: number) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        toast.success("Notification marked as read");
      } else {
        toast.error(result.error || "Failed to mark notification as read");
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    startTransition(async () => {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error || "Failed to mark all notifications as read");
      }
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-white to-slate-50">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              {unreadCount > 0 ? (
                <BellRing className="h-5 w-5 text-indigo-600" />
              ) : (
                <Bell className="h-5 w-5 text-slate-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-slate-600">Stay updated on discussions and mentions</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              {isPending ? "Marking..." : "Mark All Read"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Button
            variant={!showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(false)}
            className={!showUnreadOnly ? "bg-slate-600 hover:bg-slate-700" : ""}
          >
            <Eye className="h-4 w-4 mr-2" />
            All ({notifications?.length || 0})
          </Button>
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(true)}
            className={showUnreadOnly ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            <BellRing className="h-4 w-4 mr-2" />
            Unread ({unreadCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!displayedNotifications || displayedNotifications.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            {showUnreadOnly ? (
              <>
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No unread notifications</p>
                <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
              </>
            ) : (
              <>
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">Notifications will appear here when you get mentioned or when someone comments on works in your hierarchy</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${notification.is_read
                    ? 'bg-white border-slate-200 hover:bg-slate-50'
                    : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                  }`}
              >
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                <Link
                  href={`/dashboard/work/${notification.work_id}`}
                  className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      {getNotificationBadge(notification.type)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {formatTimeAgo(notification.created_at)}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm ${notification.is_read ? 'text-slate-700' : 'text-slate-900 font-medium'}`}>
                    {notification.message}
                  </p>

                  {notification.work_id && (
                    <p className="text-xs text-indigo-600 mt-1 hover:underline font-medium">
                      Click to view work and reply →
                    </p>
                  )}
                </Link>

                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                    disabled={isPending}
                    className="shrink-0 hover:bg-slate-200"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Show More/Less Button */}
            {hasMoreNotifications && (
              <div className="flex justify-center pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-slate-600 border-slate-300 hover:bg-slate-50"
                >
                  {showAll ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show More ({filteredNotifications.length - 4} hidden)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
