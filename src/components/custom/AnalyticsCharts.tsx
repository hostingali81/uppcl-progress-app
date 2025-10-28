// src/components/custom/AnalyticsCharts.tsx
"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3, TrendingUp, DollarSign, CheckCircle, Clock, Play } from "lucide-react";

// Step 1: Define the shape of the props this component will receive.
type AnalyticsChartsProps = {
  statusData: { name: string; value: number; }[];
  financialData: { name: string; value: number; }[];
  districtData: { name: string; total: number; }[];
  monthlyData: { month: string; total: number; completed: number; completionRate: number; }[];
  chartTitle: string;
  kpis: {
    totalWorks: number;
    completedWorks: number;
    notStartedWorks: number;
    blockedWorks: number;
    totalAgreementValue: number;
    completedValue: number;
    averageProgress: number;
  };
  colors: {
    completed: string;
    inProgress: string;
    notStarted: string;
    barChart: string;
  };
  onKPIClick?: (filterType: 'all' | 'completed' | 'in_progress' | 'not_started' | 'blocked') => void;
  activeFilter?: string;
};

export function AnalyticsCharts({ statusData, financialData, districtData, monthlyData, chartTitle, kpis, colors, onKPIClick, activeFilter }: AnalyticsChartsProps) {
  // Define the colors for the Pie chart based on the KPI colors
  const pieChartColors = {
    Completed: '#16a34a', // text-green-600
    'In Progress': '#9333ea', // text-purple-600
    'Not Started': '#4b5563', // text-gray-600
  };

  // Format currency based on the value range
  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      const crores = value / 10000000;
      return `₹${crores.toFixed(2)}Cr`;
    }
    if (value >= 100000) {
      const lakhs = value / 100000;
      return `₹${lakhs.toFixed(2)}L`;
    }
    if (value >= 1000) {
      const thousands = value / 1000;
      return `₹${thousands.toFixed(2)}K`;
    }
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card 
          className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${onKPIClick ? 'cursor-pointer hover:border-blue-300' : ''} ${activeFilter === 'all' ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
          onClick={() => onKPIClick?.('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Works</p>
                <p className="text-2xl font-bold text-slate-900">{kpis.totalWorks}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${onKPIClick ? 'cursor-pointer hover:border-green-300' : ''} ${activeFilter === 'completed' ? 'ring-2 ring-green-500 border-green-500' : ''}`}
          onClick={() => onKPIClick?.('completed')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{kpis.completedWorks}</p>
                <p className="text-xs text-slate-500">{((kpis.completedWorks / kpis.totalWorks) * 100).toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${onKPIClick ? 'cursor-pointer hover:border-purple-300' : ''} ${activeFilter === 'in_progress' ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}
          onClick={() => onKPIClick?.('in_progress')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{kpis.totalWorks - kpis.completedWorks - kpis.notStartedWorks}</p>
                <p className="text-xs text-slate-500">{(((kpis.totalWorks - kpis.completedWorks - kpis.notStartedWorks) / kpis.totalWorks) * 100).toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${onKPIClick ? 'cursor-pointer hover:border-gray-300' : ''} ${activeFilter === 'not_started' ? 'ring-2 ring-gray-500 border-gray-500' : ''}`}
          onClick={() => onKPIClick?.('not_started')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Not Started</p>
                <p className="text-2xl font-bold text-gray-600">{kpis.notStartedWorks}</p>
                <p className="text-xs text-slate-500">{((kpis.notStartedWorks / kpis.totalWorks) * 100).toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 ${onKPIClick ? 'cursor-pointer hover:border-red-300' : ''} ${activeFilter === 'blocked' ? 'ring-2 ring-red-500 border-red-500' : ''}`}
          onClick={() => onKPIClick?.('blocked')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Blocked</p>
                <p className="text-2xl font-bold text-red-600">{kpis.blockedWorks}</p>
                <p className="text-xs text-slate-500">{((kpis.blockedWorks / kpis.totalWorks) * 100).toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Status Distribution */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <PieChartIcon className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Work Status Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={2}
                  stroke="#fff"
                  isAnimationActive={false}
                  style={{ outline: 'none' }}
                  activeShape={false}
                  label={(entry: any) => {
                    const total = statusData.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.value / total) * 100).toFixed(0);
                    return `${entry.value} (${percent}%)`;
                  }}
                  labelLine={{ stroke: '#666666', strokeWidth: 1 }}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieChartColors[entry.name as keyof typeof pieChartColors]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Progress */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Financial Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={2}
                  stroke="#fff"
                  style={{ outline: 'none' }}
                  label={(entry: any) => {
                    const total = financialData.reduce((sum, item) => sum + item.value, 0);
                    if (total === 0) return '';
                    const percent = ((entry.value / total) * 100).toFixed(1);
                    return formatCurrency(entry.value) + ` (${percent}%)`;
                  }}
                  labelLine={{ stroke: '#666666', strokeWidth: 1 }}
                >
                  {financialData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={pieChartColors[entry.name as keyof typeof pieChartColors]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Value']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District-wise Works */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">{chartTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="total" 
                  fill={colors.barChart} 
                  name="Total Works"
                  radius={[4, 4, 0, 0]}
                  style={{ outline: 'none' }}
                  className="focus:outline-none"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Progress Trend */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Monthly Progress Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `${Math.round(value)}%`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Math.round(value as number)}%`, 
                    name === 'completionRate' ? 'Completion Rate (%)' : name
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke={colors.barChart} 
                  fill={`${colors.barChart}20`}
                  name="Completion Rate (%)"
                  style={{ outline: 'none' }}
                  className="focus:outline-none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}