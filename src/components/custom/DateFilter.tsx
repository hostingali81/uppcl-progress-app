// src/components/custom/DateFilter.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, History, CalendarDays, Sparkles } from "lucide-react";

interface DateFilterProps {
  onDateChange: (date: string | null) => void;
  selectedDate: string | null;
}

export function DateFilter({ onDateChange, selectedDate }: DateFilterProps) {
  const handleDateSelect = (date: string | null) => {
    onDateChange(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    return [
      { 
        label: 'Today', 
        value: today.toISOString().split('T')[0],
        icon: <Sparkles className="h-3 w-3" />
      },
      { 
        label: 'Yesterday', 
        value: yesterday.toISOString().split('T')[0],
        icon: <Clock className="h-3 w-3" />
      },
      { 
        label: 'Last Week', 
        value: lastWeek.toISOString().split('T')[0],
        icon: <Calendar className="h-3 w-3" />
      },
      { 
        label: 'Last Month', 
        value: lastMonth.toISOString().split('T')[0],
        icon: <CalendarDays className="h-3 w-3" />
      },
    ];
  };

  const isSelected = (value: string | null) => {
    return selectedDate === value;
  };

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="border-b border-slate-200 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <History className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Historical View</CardTitle>
              <p className="text-xs text-slate-600">Select date to see past progress</p>
            </div>
          </div>
          {selectedDate ? (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(selectedDate)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Quick Date Options - Compact Grid */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Quick Select</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {getQuickDateOptions().map((option) => (
              <Button
                key={option.value}
                variant={isSelected(option.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleDateSelect(option.value)}
                className={`h-8 px-2 text-xs transition-all duration-200 ${
                  isSelected(option.value) 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md" 
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1">
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Input - Compact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Custom Date</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="date"
                value={selectedDate || ''}
                onChange={(e) => handleDateSelect(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-slate-300"
                max={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(null)}
                className="px-3 py-2 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Compact Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <p>Select any date to see progress as it was on that day. &quot;Live&quot; shows current progress.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
