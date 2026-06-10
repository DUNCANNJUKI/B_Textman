import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--warning))"];

export default function Analytics() {
  const { clientId, roles } = useAuth();
  const admin = isAdmin(roles);
  const [byDay, setByDay] = useState<any[]>([]);
  const [byStatus, setByStatus] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const q = admin ? supabase.from("messages").select("status,created_at") : supabase.from("messages").select("status,created_at").eq("client_id", clientId ?? "");
      const { data } = await q.gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString()).limit(5000);
      const days = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        days.set(d.toISOString().slice(5, 10), 0);
      }
      const statusCount: Record<string, number> = {};
      (data ?? []).forEach((m: any) => {
        const k = new Date(m.created_at).toISOString().slice(5, 10);
        days.set(k, (days.get(k) ?? 0) + 1);
        statusCount[m.status] = (statusCount[m.status] ?? 0) + 1;
      });
      setByDay(Array.from(days.entries()).map(([day, count]) => ({ day, count })));
      setByStatus(Object.entries(statusCount).map(([name, value]) => ({ name, value })));
    };
    load();
  }, [clientId, admin]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Analytics</h1><p className="text-sm text-muted-foreground">30-day SMS performance</p></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Messages per day</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Status breakdown</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}
