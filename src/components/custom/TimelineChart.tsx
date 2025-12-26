
"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatDateDDMMYYYY } from '@/lib/utils';
import { CalendarCheck, Clock, TrendingUp } from 'lucide-react';

interface TimelineChartProps {
    startDate: string | null;
    scheduledDate: string | null;
    expectedDate: string | null;
    actualDate: string | null;
}

export function TimelineChart({ startDate, scheduledDate, expectedDate, actualDate }: TimelineChartProps) {
    if (!startDate) {
        return (
            <div className="text-center py-10 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-200">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Start Date is required to generate the timeline chart.</p>
            </div>
        );
    }

    const start = new Date(startDate).getTime();

    const calculateDays = (dateStr: string | null) => {
        if (!dateStr) return 0;
        const end = new Date(dateStr).getTime();
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const data = [
        {
            name: 'Scheduled',
            days: calculateDays(scheduledDate),
            date: scheduledDate,
            fill: 'url(#scheduledGradient)',
            color: '#3b82f6'
        },
        {
            name: 'Expected',
            days: calculateDays(expectedDate),
            date: expectedDate,
            fill: 'url(#expectedGradient)',
            color: '#f59e0b'
        },
        {
            name: 'Actual',
            days: calculateDays(actualDate),
            date: actualDate,
            fill: 'url(#actualGradient)',
            color: '#10b981'
        }
    ].filter(item => item.date); // Only show valid dates

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const icons = {
                'Scheduled': <CalendarCheck className="h-4 w-4 text-blue-500" />,
                'Expected': <Clock className="h-4 w-4 text-amber-500" />,
                'Actual': <TrendingUp className="h-4 w-4 text-emerald-500" />
            };

            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 border-2 border-slate-200 shadow-xl rounded-xl animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        {icons[data.name as keyof typeof icons]}
                        <p className="font-bold text-slate-900 text-base">{data.name} Completion</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Date:</span> {formatDateDDMMYYYY(data.date)}
                        </p>
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Duration:</span> <span className="font-bold text-slate-800">{data.days}</span> days from start
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-gradient-to-br from-white via-blue-50/20 to-purple-50/10 rounded-xl border border-slate-200/60 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Timeline Comparison</h3>
            </div>

            <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{
                            top: 5,
                            right: 40,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            {/* Gradient definitions */}
                            <linearGradient id="scheduledGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="expectedGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#14b8a6" stopOpacity={1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 14, fontWeight: 600, fill: '#475569' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                        <Bar
                            dataKey="days"
                            radius={[0, 12, 12, 0]}
                            barSize={50}
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    stroke={entry.color}
                                    strokeWidth={2}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500 bg-slate-50/50 py-2 px-4 rounded-lg border border-slate-200/60">
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Duration calculated from Start Date:</span>
                <span className="font-bold text-slate-700">{formatDateDDMMYYYY(startDate)}</span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200/60">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: item.color }}
                        ></div>
                        <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                        <span className="text-xs text-slate-500">({item.days}d)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
