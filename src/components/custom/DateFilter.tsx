// src/components/custom/DateFilter.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, History, CalendarDays, Sparkles, Archive } from "lucide-react";

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
        label: 'Last Week',
        value: lastWeek.toISOString().split('T')[0],
        icon: <CalendarDays className="h-4 w-4" />,
        isInput: false
      },
      {
        label: 'Last Month',
        value: lastMonth.toISOString().split('T')[0],
        icon: <Calendar className="h-4 w-4" />,
        isInput: false
      }
    ];
  };

  const isSelected = (value: string | null) => {
    return selectedDate === value;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-lg overflow-hidden">
      <CardHeader className="border-b border-slate-200/60 p-2 bg-gradient-to-r from-white to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm">
              <Archive className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Archive Progress
            </CardTitle>
          </div>
          {selectedDate ? (
            <Badge variant="secondary" className="text-sm bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200/60 px-3 py-1.5 shadow-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {formatDate(selectedDate)}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200/60 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Live
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Desktop Layout: All elements in one row */}
      <CardContent className="p-4 hidden md:block">
        <div className="flex items-center gap-3">
          {/* Last Week Button */}
          <Button
            variant={isSelected(getAllDateOptions()[0].value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateSelect(getAllDateOptions()[0].value)}
            className={`flex-1 h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg ${
              isSelected(getAllDateOptions()[0].value)
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700"
                : "hover:bg-blue-50 border-blue-200 hover:border-blue-300 bg-white/70 backdrop-blur-sm"
            }`}
          >
            <div className="flex items-center gap-2">
              {getAllDateOptions()[0].icon}
              {getAllDateOptions()[0].label}
            </div>
          </Button>

          {/* Last Month Button */}
          <Button
            variant={isSelected(getAllDateOptions()[1].value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateSelect(getAllDateOptions()[1].value)}
            className={`flex-1 h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg ${
              isSelected(getAllDateOptions()[1].value)
                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:from-purple-600 hover:to-purple-700"
                : "hover:bg-purple-50 border-purple-200 hover:border-purple-300 bg-white/70 backdrop-blur-sm"
            }`}
          >
            <div className="flex items-center gap-2">
              {getAllDateOptions()[1].icon}
              {getAllDateOptions()[1].label}
            </div>
          </Button>

          {/* Calendar Input - Prefilled with today's date */}
          <div className="flex-1 relative">
            <div className="relative">
              <input
                type="date"
                value={selectedDate || today}
                onChange={(e) => handleDateSelect(e.target.value || null)}
                className="w-full h-10 px-4 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white hover:border-slate-300 shadow-sm"
                max={today}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Clear Button */}
          {selectedDate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(null)}
              className="h-10 px-4 text-sm font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all border-red-200 bg-white/70 backdrop-blur-sm rounded-lg"
            >
              Clear
            </Button>
          )}
        </div>
      </CardContent>

      {/* Mobile Layout: Stacked vertically */}
      <CardContent className="p-3 md:hidden space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {getAllDateOptions().map((option) => (
            <Button
              key={option.value}
              variant={isSelected(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateSelect(option.value)}
              className={`h-10 px-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                isSelected(option.value)
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "hover:bg-slate-50 border-slate-200 bg-white/70 backdrop-blur-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <span className="text-xs">{option.label}</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="relative">
          <input
            type="date"
            value={selectedDate || today}
            onChange={(e) => handleDateSelect(e.target.value || null)}
            className="w-full h-10 px-4 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white hover:border-slate-300 shadow-sm"
            max={today}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {selectedDate && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(null)}
              className="h-9 px-4 text-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all border-red-200 bg-white/70 backdrop-blur-sm rounded-lg"
            >
              Clear Filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
