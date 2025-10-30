
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

  const getAllDateOptions = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    return [
      {
        label: 'Today',
        value: today.toISOString().split('T')[0],
        icon: <Sparkles className="h-2.5 w-2.5" />,
        isInput: false
      },
      {
        label: 'Last Week',
        value: lastWeek.toISOString().split('T')[0],
        icon: <Calendar className="h-2.5 w-2.5" />,
        isInput: false
      },
      {
        label: 'Last Month',
        value: lastMonth.toISOString().split('T')[0],
        icon: <CalendarDays className="h-2.5 w-2.5" />,
        isInput: false
      },
      {
        label: 'Custom',
        value: null,
        icon: <Calendar className="h-2.5 w-2.5" />,
        isInput: true
      },
    ];
  };

  const isSelected = (value: string | null) => {
    return selectedDate === value;
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200 p-1 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-slate-600" />
            <CardTitle className="text-sm font-medium text-slate-900">Archive Progress</CardTitle>
          </div>
          {selectedDate ? (
            <Badge variant="secondary" className="text-sm bg-purple-100 text-purple-700 border-purple-200 px-2 py-1">
              <Calendar className="h-3 w-3 mr-0.5" />
              {formatDate(selectedDate)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm bg-green-100 text-green-700 border-green-200 px-2 py-1">
              <Sparkles className="h-3 w-3 mr-0.5" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-1.5 space-y-0.5">
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1">
            {getAllDateOptions().map((option) => {
              if (option.isInput) {
                return (
                  <div key={option.label} className="relative">
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => handleDateSelect(e.target.value || null)}
                      className="w-full h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white hover:border-slate-300"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                );
              }

              return (
                <Button
                  key={option.value}
                  variant={isSelected(option.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateSelect(option.value)}
                  className={`h-8 px-2 text-sm transition-all ${
                    isSelected(option.value)
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                      : "hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-0.5">
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                  </div>
                </Button>
              );
            })}
          </div>
          {selectedDate && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(null)}
                className="h-8 px-3 py-1 text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all border-slate-200"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
