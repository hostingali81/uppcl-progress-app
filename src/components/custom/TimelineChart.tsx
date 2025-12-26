
"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { formatDateDDMMYYYY } from '@/lib/utils';

interface TimelineChartProps {
    startDate: string | null;
    scheduledDate: string | null;
    expectedDate: string | null;
    actualDate: string | null;
}

export function TimelineChart({ startDate, scheduledDate, expectedDate, actualDate }: TimelineChartProps) {
    if (!startDate) {
        return <div className="text-center text-slate-500 py-10">Start Date is required to generate the timeline chart.</div>;
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
            fill: '#3b82f6' // blue-500
        },
        {
            name: 'Expected',
            days: calculateDays(expectedDate),
            date: expectedDate,
            fill: '#f59e0b' // amber-500
        },
        {
            name: 'Actual',
            days: calculateDays(actualDate),
            date: actualDate,
            fill: '#10b981' // emerald-500
        }
    ].filter(item => item.date); // Only show valid dates

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                    <p className="font-semibold text-slate-900">{data.name} Completion</p>
                    <p className="text-sm text-slate-600">Date: {formatDateDDMMYYYY(data.date)}</p>
                    <p className="text-sm text-slate-600">Duration: {data.days} days from start</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 14 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={40}>
                        {
                            data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))
                        }
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="text-center text-xs text-slate-500 mt-2">
                Duration calculated from Start Date: <span className="font-medium">{formatDateDDMMYYYY(startDate)}</span>
            </div>
        </div>
    );
}
