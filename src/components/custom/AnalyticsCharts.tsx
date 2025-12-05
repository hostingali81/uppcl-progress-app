// src/components/custom/AnalyticsCharts.tsx
"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3, TrendingUp, DollarSign, CheckCircle, Clock, Play, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import styles from './analytics-premium.module.css';

// Step 1: Define the shape of the props this component will receive.
type AnalyticsChartsProps = {
  statusData: { name: string; value: number; }[];
  financialData: { name: string; value: number; }[];
  districtData: { name: string; total: number; }[];
  monthlyData: { week: string; total: number; completed: number; completionRate: number; }[];
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
    Completed: '#10b981', // Green
    'In Progress': '#8b5cf6', // Purple
    'Not Started': '#f59e0b', // Orange
  };

  // Bar chart color gradient based on workload
  const getBarColor = (value: number) => {
    const max = Math.max(...districtData.map(d => d.total));
    const ratio = value / max;
    if (ratio > 0.7) return '#3b82f6'; // High - Blue
    if (ratio > 0.4) return '#14b8a6'; // Medium - Teal
    return '#8b5cf6'; // Low - Purple
  };

  // Check if we're on mobile for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Custom label component for donut center
  const renderCenterLabel = (value: string) => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900 text-xl font-bold"
      >
        {value}
      </text>
    );
  };

  const inProgressWorks = kpis.totalWorks - kpis.completedWorks - kpis.notStartedWorks;

  return (
    <div className="space-y-6">
      {/* Premium KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Total Works - Blue */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardBlue} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => onKPIClick?.('all')}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiIcon}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className={styles.kpiLabel}>Total Works</p>
            <p className={styles.kpiValue}>{kpis.totalWorks}</p>
            <div className={styles.kpiPercentage}>
              <span>100% of portfolio</span>
            </div>
          </div>
        </div>

        {/* Completed - Green */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardGreen} ${activeFilter === 'completed' ? styles.active : ''}`}
          onClick={() => onKPIClick?.('completed')}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiIcon}>
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <p className={styles.kpiLabel}>Completed</p>
            <p className={styles.kpiValue}>{kpis.completedWorks}</p>
            <div className={styles.kpiPercentage}>
              <span>{((kpis.completedWorks / kpis.totalWorks) * 100).toFixed(1)}% complete</span>
            </div>
          </div>
        </div>

        {/* In Progress - Purple */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardPurple} ${activeFilter === 'in_progress' ? styles.active : ''}`}
          onClick={() => onKPIClick?.('in_progress')}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiIcon}>
              <Clock className="h-6 w-6 text-white" />
            </div>
            <p className={styles.kpiLabel}>In Progress</p>
            <p className={styles.kpiValue}>{inProgressWorks}</p>
            <div className={styles.kpiPercentage}>
              <span>{((inProgressWorks / kpis.totalWorks) * 100).toFixed(1)}% ongoing</span>
            </div>
          </div>
        </div>

        {/* Not Started - Orange */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardOrange} ${activeFilter === 'not_started' ? styles.active : ''}`}
          onClick={() => onKPIClick?.('not_started')}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiIcon}>
              <Play className="h-6 w-6 text-white" />
            </div>
            <p className={styles.kpiLabel}>Not Started</p>
            <p className={styles.kpiValue}>{kpis.notStartedWorks}</p>
            <div className={styles.kpiPercentage}>
              <span>{((kpis.notStartedWorks / kpis.totalWorks) * 100).toFixed(1)}% pending</span>
            </div>
          </div>
        </div>

        {/* Blocked - Red */}
        <div
          className={`${styles.kpiCard} ${styles.kpiCardRed} ${activeFilter === 'blocked' ? styles.active : ''}`}
          onClick={() => onKPIClick?.('blocked')}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiIcon}>
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <p className={styles.kpiLabel}>High Priority or Blocked</p>
            <p className={styles.kpiValue}>{kpis.blockedWorks}</p>
            <div className={styles.kpiPercentage}>
              <span>{((kpis.blockedWorks / kpis.totalWorks) * 100).toFixed(1)}% high priority/blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Work Status Distribution - Clean Donut Chart */}
        <Card className={`${styles.chartCard}`}>
          <CardHeader className={styles.chartHeader}>
            <div className={styles.chartHeaderContent}>
              <div className={`${styles.chartIconWrapper} ${styles.green}`}>
                <PieChartIcon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className={styles.chartTitle}>Work Status Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.chartContent}>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 70}
                  outerRadius={isMobile ? 80 : 110}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={3}
                  stroke="#fff"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationBegin={0}
                  style={{ outline: 'none' }}
                  label={!isMobile ? (entry: any) => {
                    const total = statusData.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.value / total) * 100).toFixed(0);
                    return `${entry.value} (${percent}%)`;
                  } : undefined}
                  labelLine={!isMobile ? { stroke: '#94a3b8', strokeWidth: 1.5 } : false}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieChartColors[entry.name as keyof typeof pieChartColors]}
                      className="hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const total = statusData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((data.value as number / total) * 100).toFixed(1);
                      return (
                        <div className={styles.customTooltip}>
                          <p className={styles.tooltipLabel}>{data.name}</p>
                          <p className={styles.tooltipValue}>{data.value} works ({percent}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend content={({ payload }) => (
                  <div className={styles.customLegend}>
                    {payload?.map((entry: any, index: number) => (
                      <div key={index} className={styles.legendItem}>
                        <div
                          className={styles.legendDot}
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Progress - Donut with Center Label */}
        <Card className={styles.chartCard}>
          <CardHeader className={styles.chartHeader}>
            <div className={styles.chartHeaderContent}>
              <div className={`${styles.chartIconWrapper} ${styles.purple}`}>
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <CardTitle className={styles.chartTitle}>Financial Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.chartContent}>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={financialData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 70}
                  outerRadius={isMobile ? 80 : 110}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={3}
                  stroke="#fff"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationBegin={100}
                  style={{ outline: 'none' }}
                  label={!isMobile ? (entry: any) => formatCurrency(entry.value) : undefined}
                  labelLine={!isMobile ? { stroke: '#94a3b8', strokeWidth: 1.5 } : false}
                >
                  {financialData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieChartColors[entry.name as keyof typeof pieChartColors]}
                      className="hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const total = financialData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((data.value as number / total) * 100).toFixed(1);
                      return (
                        <div className={styles.customTooltip}>
                          <p className={styles.tooltipLabel}>{data.name}</p>
                          <p className={styles.tooltipValue}>{formatCurrency(data.value as number)}</p>
                          <p className="text-xs text-slate-600 mt-1">{percent}% of total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend content={({ payload }) => (
                  <div className={styles.customLegend}>
                    {payload?.map((entry: any, index: number) => (
                      <div key={index} className={styles.legendItem}>
                        <div
                          className={styles.legendDot}
                          style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* District-wise Works - Rounded Bar Chart */}
        <Card className={styles.chartCard}>
          <CardHeader className={styles.chartHeader}>
            <div className={styles.chartHeaderContent}>
              <div className={`${styles.chartIconWrapper} ${styles.blue}`}>
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className={styles.chartTitle}>{chartTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.chartContent}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={districtData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={styles.customTooltip}>
                          <p className={styles.tooltipLabel}>{payload[0].payload.name}</p>
                          <p className={styles.tooltipValue}>{payload[0].value} works</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                />
                <Bar
                  dataKey="total"
                  fill="url(#barGradient)"
                  name="Total Works"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationBegin={200}
                  label={{ position: 'top', fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Progress - Smooth Curved Line Chart */}
        <Card className={styles.chartCard}>
          <CardHeader className={styles.chartHeader}>
            <div className={styles.chartHeaderContent}>
              <div className={`${styles.chartIconWrapper} ${styles.orange}`}>
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <CardTitle className={styles.chartTitle}>Weekly Progress Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className={styles.chartContent}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(value)}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={styles.customTooltip}>
                          <p className={styles.tooltipLabel}>{payload[0].payload.week}</p>
                          <p className={styles.tooltipValue}>{Math.round(payload[0].value as number)}%</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {payload[0].payload.completed} of {payload[0].payload.total} completed
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#lineGradient)"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
