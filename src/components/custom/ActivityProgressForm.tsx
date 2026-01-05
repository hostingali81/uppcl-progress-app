"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { getWorkActivities, bulkUpdateActivitiesProgress } from "@/app/(main)/dashboard/work/[id]/activities-actions";
import type { WorkActivity } from "@/lib/types";
import { toast } from "sonner";

interface ActivityProgressFormProps {
  workId: number;
  onProgressUpdate?: () => void;
}

export function ActivityProgressForm({ workId, onProgressUpdate }: ActivityProgressFormProps) {
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadActivities();
  }, [workId]);

  const loadActivities = async () => {
    console.log('[ActivityProgressForm] Loading activities for workId:', workId);
    setLoading(true);
    const result = await getWorkActivities(workId);
    console.log('[ActivityProgressForm] Result:', result);
    console.log('[ActivityProgressForm] Result data:', JSON.stringify(result.data, null, 2));
    
    // If no activities found, try to initialize from schedule
    if (result.success && (!result.data || result.data.length === 0)) {
      console.log('[ActivityProgressForm] No activities found, initializing from schedule...');
      const { initializeActivitiesFromSchedule } = await import('@/app/(main)/dashboard/work/[id]/activities-actions');
      const initResult = await initializeActivitiesFromSchedule(workId);
      console.log('[ActivityProgressForm] Initialize result:', initResult);
      
      if (initResult.success) {
        const reloadResult = await getWorkActivities(workId);
        if (reloadResult.success && reloadResult.data) {
          console.log('[ActivityProgressForm] Activities loaded after init:', reloadResult.data.length);
          setActivities(reloadResult.data);
          const initialUpdates: Record<string, number> = {};
          reloadResult.data.forEach((activity: WorkActivity) => {
            console.log('[ActivityProgressForm] Activity:', activity.activity_code, 'Progress:', activity.progress_percentage);
            initialUpdates[activity.activity_code] = Math.round(activity.progress_percentage);
          });
          console.log('[ActivityProgressForm] Initial updates:', initialUpdates);
          setUpdates(initialUpdates);
          setLoading(false);
          return;
        }
      }
    }
    
    if (result.success && result.data) {
      console.log('[ActivityProgressForm] Activities loaded:', result.data.length);
      
      // Check if all activities are marked as editable (no parent-child relationships)
      const hasParentChild = result.data.some((a: WorkActivity) => a.parent_activity_id !== null);
      
      if (!hasParentChild && result.data.length > 0) {
        console.log('[ActivityProgressForm] No parent-child relationships found, re-initializing...');
        const response = await fetch('/api/reinitialize-activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workId })
        });
        
        if (response.ok) {
          const reloadResult = await getWorkActivities(workId);
          if (reloadResult.success && reloadResult.data) {
            setActivities(reloadResult.data);
            const initialUpdates: Record<string, number> = {};
            reloadResult.data.forEach((activity: WorkActivity) => {
              initialUpdates[activity.activity_code] = Math.round(activity.progress_percentage);
            });
            setUpdates(initialUpdates);
            setLoading(false);
            return;
          }
        }
      }
      
      setActivities(result.data);
      const initialUpdates: Record<string, number> = {};
      result.data.forEach((activity: WorkActivity) => {
        console.log('[ActivityProgressForm] Activity:', activity.activity_code, 'Progress:', activity.progress_percentage);
        initialUpdates[activity.activity_code] = Math.round(activity.progress_percentage);
      });
      console.log('[ActivityProgressForm] Initial updates:', initialUpdates);
      setUpdates(initialUpdates);
    } else {
      console.error('[ActivityProgressForm] Failed to load activities:', result.error);
    }
    setLoading(false);
  };

  const handleProgressChange = (activityCode: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(Math.max(numValue, 0), 100);
    setUpdates(prev => ({ ...prev, [activityCode]: clampedValue }));
  };

  const toggleActivity = (activityId: number) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    const changedUpdates = Object.entries(updates)
      .filter(([code, progress]) => {
        const activity = activities.find(a => a.activity_code === code);
        return activity && activity.progress_percentage !== progress;
      })
      .map(([activityCode, progress]) => ({ activityCode, progress }));

    if (changedUpdates.length === 0) {
      toast.info("No changes to save");
      setSaving(false);
      return;
    }

    const result = await bulkUpdateActivitiesProgress(workId, changedUpdates);
    
    if (result.success) {
      toast.success("Activity progress updated successfully");
      await loadActivities();
      onProgressUpdate?.();
    } else {
      toast.error(result.error || "Failed to update progress");
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    console.log('[ActivityProgressForm] No activities found, returning null');
    return (
      <Card className="border-2 border-yellow-100 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-slate-600">
            <p className="mb-2">No activities found for this work.</p>
            <p className="text-sm">Please add activities in the <a href={`/dashboard/work/${workId}/schedule`} className="text-blue-600 underline">Detailed Schedule</a> page first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mainActivities = activities.filter(a => a.is_main_activity);
  const subActivities = activities.filter(a => !a.is_main_activity);

  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">Update Activity Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Render each main activity with its sub-activities */}
        {mainActivities.map((mainActivity, index) => {
          const children = subActivities.filter(sub => sub.parent_activity_id === mainActivity.id);
          const colors = [
            { bg: 'bg-gradient-to-r from-green-50 to-emerald-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
            { bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
            { bg: 'bg-gradient-to-r from-purple-50 to-pink-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
            { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
            { bg: 'bg-gradient-to-r from-red-50 to-rose-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
            { bg: 'bg-gradient-to-r from-teal-50 to-cyan-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
          ];
          const color = colors[index % colors.length];
          
          return (
            <div key={mainActivity.id} className={`border-2 ${color.border} rounded-xl space-y-3 ${color.bg} shadow-md hover:shadow-lg transition-shadow`}>
              {/* Main Activity Header */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {children.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActivity(mainActivity.id)}
                        className="h-8 w-8 p-0 hover:bg-white/50"
                      >
                        {expandedActivities.has(mainActivity.id) ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </Button>
                    )}
                    <Label className="text-base font-bold text-slate-800 flex items-center gap-2 cursor-pointer" onClick={() => children.length > 0 && toggleActivity(mainActivity.id)}>
                      <span className={`px-2 py-1 rounded-md ${color.badge} text-xs font-semibold`}>
                        {mainActivity.activity_code.toUpperCase()}
                      </span>
                      {mainActivity.activity_name}
                    </Label>
                  </div>
                  <Badge variant="secondary" className={children.length > 0 ? "text-xs bg-yellow-100 text-yellow-700 border border-yellow-300" : "text-xs bg-green-100 text-green-700 border border-green-300"}>
                    {children.length > 0 ? "🔄 Auto-calculated" : "✏️ Editable"}
                  </Badge>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={updates[mainActivity.activity_code] || ""}
                    disabled={children.length > 0}
                    onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                    onChange={(e) => handleProgressChange(mainActivity.activity_code, e.target.value)}
                    className={children.length > 0 ? "bg-white/80 border-2 font-semibold text-lg" : "bg-white border-2 font-semibold text-lg"}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                </div>
              </div>

              {/* Sub Activities - Collapsible */}
              {expandedActivities.has(mainActivity.id) && children.length > 0 && (
                <div className="px-4 pb-4 ml-4 space-y-3 border-t-2 border-dashed border-slate-300 pt-3">
                  {children.map(subActivity => (
                    <div key={subActivity.id} className="space-y-2 bg-white/60 p-3 rounded-lg border border-slate-200 hover:bg-white/80 transition-colors">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-bold">
                          {subActivity.activity_code.toUpperCase()}
                        </span>
                        {subActivity.activity_name}
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={updates[subActivity.activity_code] || ""}
                          onFocus={(e) => e.target.value === "0" && (e.target.value = "")}
                          onChange={(e) => handleProgressChange(subActivity.activity_code, e.target.value)}
                          className="flex-1 border-2 focus:border-blue-400 font-medium"
                        />
                        <span className="text-sm text-slate-600 font-bold w-8">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5 mr-2" />
              Save Progress
            </>
          )}
        </Button>

        <p className="text-xs text-slate-600 text-center bg-blue-50 p-2 rounded-lg border border-blue-200">
          💡 Main activity progress is automatically calculated from sub-activities using weighted average
        </p>
      </CardContent>
    </Card>
  );
}
