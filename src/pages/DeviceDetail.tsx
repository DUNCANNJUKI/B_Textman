import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Smartphone } from "lucide-react";

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    const [{ data: d }, { data: m }, { data: l }] = await Promise.all([
      supabase.from("devices").select("*").eq("id", id).maybeSingle(),
      supabase.from("messages").select("*").eq("device_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("device_logs").select("*").eq("device_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    setDevice(d); setMessages(m ?? []); setLogs(l ?? []);
  };

  useEffect(() => { if (id) load(); }, [id]);

  if (!device) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Link to="/devices" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1" />Back to devices</Link>

      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"><Smartphone className="h-6 w-6 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold">{device.device_name}</h1>
              <p className="text-sm text-muted-foreground font-mono">{device.phone_number ?? "no number"}</p>
            </div>
          </div>
          <Badge variant="outline">{device.status}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <Field label="Operator" value={device.sim_operator ?? "—"} />
          <Field label="SIM slot" value={device.sim_slot ?? "—"} />
          <Field label="Android" value={device.android_version ?? "—"} />
          <Field label="App version" value={device.app_version ?? "—"} />
          <Field label="Battery" value={`${device.battery_level ?? 0}%`} />
          <Field label="Signal" value={`${device.signal_strength ?? 0}`} />
          <Field label="Internet" value={device.internet_type ?? "—"} />
          <Field label="IP" value={device.ip_address ?? "—"} />
          <Field label="Total sent" value={device.total_sms_sent} />
          <Field label="Total failed" value={device.total_sms_failed} />
          <Field label="Last seen" value={device.last_seen ? new Date(device.last_seen).toLocaleString() : "never"} />
          <Field label="Token" value={<code className="text-[10px]">{device.device_token.slice(0, 18)}…</code>} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Recent SMS</h3>
          <div className="space-y-2 max-h-96 overflow-auto">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages</p>}
            {messages.map((m) => (
              <div key={m.id} className="text-sm border-b border-border/60 py-2 last:border-0">
                <div className="flex justify-between"><span className="font-mono">{m.recipient}</span><span className="text-xs text-muted-foreground">{m.status}</span></div>
                <p className="text-xs text-muted-foreground truncate">{m.message}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Device logs</h3>
          <div className="space-y-2 max-h-96 overflow-auto text-xs">
            {logs.length === 0 && <p className="text-sm text-muted-foreground">No logs</p>}
            {logs.map((l) => (
              <div key={l.id} className="border-b border-border/60 py-2 last:border-0">
                <div className="flex justify-between"><span className="font-medium">{l.event_type}</span><span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span></div>
                {l.payload && <pre className="text-[10px] text-muted-foreground mt-1 truncate">{JSON.stringify(l.payload)}</pre>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>;
}
