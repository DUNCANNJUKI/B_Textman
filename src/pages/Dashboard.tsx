import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MessageSquare, CheckCircle2, XCircle, Clock, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import Seo from "@/components/Seo";

type Stats = { sent: number; delivered: number; failed: number; queued: number; devices_online: number; devices_total: number };

function formatAge(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function Dashboard() {
  const { clientId, roles } = useAuth();
  const admin = isAdmin(roles);
  const [stats, setStats] = useState<Stats>({ sent: 0, delivered: 0, failed: 0, queued: 0, devices_online: 0, devices_total: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [series, setSeries] = useState<{ time: string; count: number }[]>([]);
  const [queueHealth, setQueueHealth] = useState<{ device_id: string | null; device_name: string; status: string; last_seen: string | null; queued: number; processing: number }[]>([]);
  const [unassigned, setUnassigned] = useState<{ queued: number; processing: number }>({ queued: 0, processing: 0 });

  const load = async () => {
    if (!admin && !clientId) {
      // No client context available yet — clear state
      setStats({ sent: 0, delivered: 0, failed: 0, queued: 0, devices_online: 0, devices_total: 0 });
      setRecent([]);
      setSeries([]);
      setQueueHealth([]);
      setUnassigned({ queued: 0, processing: 0 });
      return;
    }
    const msgQ = admin ? supabase.from("messages").select("status") : supabase.from("messages").select("status").eq("client_id", clientId as string);
    const devQ = admin ? supabase.from("devices").select("status") : supabase.from("devices").select("status").eq("client_id", clientId as string);
    const recentQ = admin ? supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(10)
      : supabase.from("messages").select("*").eq("client_id", clientId as string).order("created_at", { ascending: false }).limit(10);
    const queueQ = admin
      ? supabase.from("messages").select("status,device_id").in("status", ["queued", "processing"])
      : supabase.from("messages").select("status,device_id").eq("client_id", clientId as string).in("status", ["queued", "processing"]);
    const devsFullQ = admin
      ? supabase.from("devices").select("id,device_name,status,last_seen")
      : supabase.from("devices").select("id,device_name,status,last_seen").eq("client_id", clientId as string);

    const [{ data: msgs }, { data: devs }, { data: recentMsgs }, { data: queueRows }, { data: devsFull }] =
      await Promise.all([msgQ, devQ, recentQ, queueQ, devsFullQ]);
    const s: Stats = { sent: 0, delivered: 0, failed: 0, queued: 0, devices_online: 0, devices_total: devs?.length ?? 0 };
    (msgs ?? []).forEach((m: any) => {
      if (m.status === "sent") s.sent++;
      else if (m.status === "delivered") s.delivered++;
      else if (m.status === "failed") s.failed++;
      else if (m.status === "queued" || m.status === "processing") s.queued++;
    });
    (devs ?? []).forEach((d: any) => { if (d.status === "online" || d.status === "sending") s.devices_online++; });
    setStats(s);
    setRecent(recentMsgs ?? []);

    // Build last 24h hourly series
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600_000);
      const k = `${d.getHours()}:00`;
      buckets.set(k, 0);
    }
    (msgs ?? []).forEach(() => {});
    // simplified: use recent
    const sinceMs = now.getTime() - 24 * 3600_000;
    (recentMsgs ?? []).forEach((m: any) => {
      const t = new Date(m.created_at).getTime();
      if (t >= sinceMs) {
        const k = `${new Date(t).getHours()}:00`;
        buckets.set(k, (buckets.get(k) ?? 0) + 1);
      }
    });
    setSeries(Array.from(buckets.entries()).map(([time, count]) => ({ time, count })));

    // Queue health per device
    const counts = new Map<string, { queued: number; processing: number }>();
    let unQ = 0, unP = 0;
    (queueRows ?? []).forEach((r: any) => {
      if (!r.device_id) {
        if (r.status === "queued") unQ++; else unP++;
        return;
      }
      const c = counts.get(r.device_id) ?? { queued: 0, processing: 0 };
      if (r.status === "queued") c.queued++; else c.processing++;
      counts.set(r.device_id, c);
    });
    const health = (devsFull ?? []).map((d: any) => ({
      device_id: d.id,
      device_name: d.device_name,
      status: d.status,
      last_seen: d.last_seen,
      queued: counts.get(d.id)?.queued ?? 0,
      processing: counts.get(d.id)?.processing ?? 0,
    })).sort((a, b) => (b.queued + b.processing) - (a.queued + a.processing));
    setQueueHealth(health);
    setUnassigned({ queued: unQ, processing: unP });
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, admin]);

  const total = stats.sent + stats.delivered + stats.failed;
  const successRate = total ? Math.round(((stats.sent + stats.delivered) / total) * 100) : 0;

  const tiles = [
    { label: "Messages sent", value: stats.sent + stats.delivered, icon: MessageSquare, color: "text-primary" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-success" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-destructive" },
    { label: "In queue", value: stats.queued, icon: Clock, color: "text-warning" },
    { label: "Active devices", value: `${stats.devices_online}/${stats.devices_total}`, icon: Smartphone, color: "text-primary" },
    { label: "Success rate", value: `${successRate}%`, icon: Activity, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <Seo
        title="Dashboard — B-TEXTMAN SMS Gateway"
        description="Realtime overview of your SMS gateway: traffic, device health, queue status, and recent message activity."
        path="/dashboard"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Realtime view of your SMS gateway</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t.label}</span>
              <t.icon className={`h-4 w-4 ${t.color}`} />
            </div>
            <div className="text-2xl font-bold tabular-nums">{t.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Traffic — last 24 hours</h2>
            <Badge variant="outline" className="text-xs">Realtime</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Recent messages</h2>
          <div className="space-y-2 max-h-64 overflow-auto">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No messages yet</p>}
            {recent.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-border/60 text-sm last:border-0">
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate">{m.recipient}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">{m.message}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold">Queue health by device</h2>
            <p className="text-xs text-muted-foreground">Confirm messages are actually moving. Stale heartbeats &gt; 90s are flagged.</p>
          </div>
          <Badge variant="outline" className="text-xs">{stats.queued} pending</Badge>
        </div>
        {(unassigned.queued + unassigned.processing) > 0 && (
          <div className="mb-3 text-xs p-2 rounded border border-warning/30 bg-warning/10 text-warning-foreground">
            {unassigned.queued + unassigned.processing} message(s) are not assigned to any device yet ({unassigned.queued} queued, {unassigned.processing} processing).
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Device</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right tabular-nums">Queued</th>
                <th className="py-2 pr-3 text-right tabular-nums">Processing</th>
                <th className="py-2 pr-3">Last heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {queueHealth.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-muted-foreground text-sm">No devices registered yet.</td></tr>
              )}
              {queueHealth.map((d) => {
                const ageMs = d.last_seen ? Date.now() - new Date(d.last_seen).getTime() : null;
                const stale = ageMs !== null && ageMs > 90_000;
                return (
                  <tr key={d.device_id ?? "u"} className="border-b border-border/40 last:border-0">
                    <td className="py-2 pr-3 font-medium truncate max-w-[180px]">{d.device_name}</td>
                    <td className="py-2 pr-3"><StatusBadge status={d.status} /></td>
                    <td className="py-2 pr-3 text-right tabular-nums">{d.queued}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{d.processing}</td>
                    <td className="py-2 pr-3 text-xs">
                      {d.last_seen ? (
                        <span className={stale ? "text-destructive" : "text-muted-foreground"}>
                          {new Date(d.last_seen).toLocaleTimeString()} {ageMs !== null && `(${formatAge(ageMs)} ago${stale ? " — stale" : ""})`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">never</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-warning/15 text-warning border-warning/30",
    processing: "bg-primary/15 text-primary border-primary/30",
    sent: "bg-primary/15 text-primary border-primary/30",
    delivered: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    cancelled: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${map[status] ?? ""}`}>{status}</span>;
}

