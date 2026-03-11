import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getCategoryColor } from "../components/CategoryBadge";
import { useApp } from "../store/AppContext";
import { CATEGORIES, type Category } from "../types";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const CATEGORY_COLORS: Record<Category, string> = {
  groceries: "#16a34a",
  rent: "#2563eb",
  utilities: "#d97706",
  medical: "#dc2626",
  travel: "#9333ea",
  education: "#0284c7",
  entertainment: "#db2777",
  other: "#6b7280",
};

export function Analytics() {
  const { expenses } = useApp();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Spending by category this month
  const categoryData = CATEGORIES.map((c) => {
    const amount = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          e.category === c.value &&
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, e) => s + e.amount, 0);
    return { name: c.label, value: amount, color: CATEGORY_COLORS[c.value] };
  }).filter((d) => d.value > 0);

  // Monthly totals — last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
    const mo = d.getMonth() + 1;
    const yr = d.getFullYear();
    const total = expenses
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getMonth() + 1 === mo && ed.getFullYear() === yr;
      })
      .reduce((s, e) => s + e.amount, 0);
    return {
      name: d.toLocaleString("default", { month: "short" }),
      total,
    };
  });

  // Per-member spending this month
  const { members } = useApp();
  const memberData = members.map((m) => {
    const paid = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          e.paidBy === m.id &&
          d.getMonth() + 1 === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, e) => s + e.amount, 0);
    const owes = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
        );
      })
      .reduce((s, e) => {
        const sp = e.splits.find((sp) => sp.memberId === m.id);
        return s + (sp?.amount ?? 0);
      }, 0);
    return { name: m.name.split(" ")[0], paid, owes, color: m.color };
  });

  const monthName = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-card">
        <p className="text-xs font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs" style={{ color: p.color }}>
            {p.name}: ₹{p.value?.toLocaleString("en-IN")}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <h1 className="font-display text-xl font-bold">Analytics</h1>
        <p className="text-primary-foreground/70 text-sm mt-0.5">{monthName}</p>
      </div>

      <div className="px-4 py-4 space-y-4 pb-20">
        {/* Category Bar Chart */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No spending this month
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.90 0.01 250)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Spent" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Line Chart */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Monthly Trend (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={monthlyData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.90 0.01 250)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={fmt}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="oklch(0.62 0.19 27)"
                  strokeWidth={2.5}
                  dot={{ fill: "oklch(0.62 0.19 27)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        {categoryData.length > 0 && (
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {categoryData.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {c.name}
                      </span>
                      <span className="text-xs font-semibold">
                        ₹{c.value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member comparison */}
        <Card className="shadow-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Member Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {memberData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={memberData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.90 0.01 250)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="paid"
                    name="Paid"
                    fill="oklch(0.62 0.19 27)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="owes"
                    name="Owes"
                    fill="oklch(0.55 0.18 260)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
