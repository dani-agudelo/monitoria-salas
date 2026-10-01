import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { coverageByDay } from "@/lib/monitoring-data";

export function CoverageChart() {
  return (
    <div className="mt-6 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={coverageByDay} barGap={6} barCategoryGap="28%">
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="rgb(241 245 249)"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgb(248 250 252)" }}
            formatter={(value, name) => [`${value} h`, name]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(241 245 249 / 0.5)",
              boxShadow: "0 8px 30px rgb(0 0 0 / 0.04)",
            }}
          />
          <Bar
            dataKey="Central"
            fill="var(--secondary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="Lans"
            fill="var(--primary)"
            radius={[8, 8, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
