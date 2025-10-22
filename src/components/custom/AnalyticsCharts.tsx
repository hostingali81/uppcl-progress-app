// src/components/custom/AnalyticsCharts.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Props के लिए टाइप परिभाषा
interface AnalyticsChartsProps {
  statusData: { name: string; value: number }[];
  divisionData: { name: string; total: number }[];
}

// पाई चार्ट के लिए रंग
const COLORS = ['#16a34a', '#f97316', '#dc2626']; // हरा, नारंगी, लाल

export function AnalyticsCharts({ statusData, divisionData }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>कार्यों की स्थिति (Status)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                // --- यहाँ बदलाव किया गया है ---
                label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} कार्य`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>डिवीजन-वार कार्यों की संख्या</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={divisionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => `${value} कार्य`} />
              <Bar dataKey="total" fill="#3b82f6" name="कुल कार्य" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}