import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string; recipient: string; message: string; status: string;
  client_id: string; device_id: string | null;
  created_at: string; processing_at: string | null; sent_at: string | null;
  delivered_at: string | null; failed_at: string | null;
  retry_count: number; max_retries: number; error_message: string | null;
};
type Evt = { id: string; message_id: string; event_type: string; payload: any; created_at: string };

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "sent" || s === "delivered") return "default";
  if (s === "failed" || s === "cancelled") return "destructive";
  if (s === "processing") return "secondary";
  return "outline";
};

const fmt = (v: string | null) => v ? new Date(v).toLocaleString() : "—";
const age = (v: string | null) => {
  if (!v) return "—";
  const s = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
};

export default function MessageTrace() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [events, setEvents] = useState<Record<string, Evt[]>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, recipient, message, status, client_id, device_id, created_at, processing_at, sent_at, delivered_at, failed_at, retry_count, max_retries, error_message")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setMessages((data ?? []) as Msg[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadEvents = async (msgId: string) => {
    setSelected(msgId);
    if (events[msgId]) return;
    const { data } = await supabase
      .from("message_events")
      .select("id, message_id, event_type, payload, created_at")
      .eq("message_id", msgId)
      .order("created_at", { ascending: true });
    setEvents((prev) => ({ ...prev, [msgId]: (data ?? []) as Evt[] }));
  };

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return messages;
    return messages.filter((m) =>
      m.id.toLowerCase().includes(f) ||
      m.recipient.toLowerCase().includes(f) ||
      m.status.toLowerCase().includes(f) ||
      (m.device_id ?? "").toLowerCase().includes(f) ||
      m.client_id.toLowerCase().includes(f),
    );
  }, [messages, filter]);

  const selectedMsg = messages.find((m) => m.id === selected);
  const selectedEvents = selected ? events[selected] ?? [] : [];

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    messages.forEach((m) => { c[m.status] = (c[m.status] ?? 0) + 1; });
    return c;
  }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message Trace</h1>
          <p className="text-sm text-muted-foreground">Live status of each message: queued → picked up → sent. Click a row for full timeline.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([s, n]) => (
          <Badge key={s} variant={statusVariant(s)} className="text-xs">{s}: {n}</Badge>
        ))}
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Filter by id, recipient, device, status…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-4">
        <Card className="overflow-hidden">
          <ScrollArea className="h-[65vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-2">Recipient</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Device</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Last move</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const last = m.delivered_at ?? m.sent_at ?? m.failed_at ?? m.processing_at ?? m.created_at;
                  return (
                    <tr key={m.id}
                        onClick={() => loadEvents(m.id)}
                        className={`border-b cursor-pointer hover:bg-muted/40 ${selected === m.id ? "bg-muted/60" : ""}`}>
                      <td className="p-2 font-mono text-xs">{m.recipient}</td>
                      <td className="p-2"><Badge variant={statusVariant(m.status)} className="text-[10px]">{m.status}</Badge></td>
                      <td className="p-2 font-mono text-[10px] text-muted-foreground">{m.device_id ? m.device_id.slice(0, 8) : "—"}</td>
                      <td className="p-2 text-xs text-muted-foreground">{age(m.created_at)}</td>
                      <td className="p-2 text-xs text-muted-foreground">{age(last)}</td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No messages</td></tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </Card>

        <Card className="p-4 space-y-3 h-[65vh] overflow-auto">
          {!selectedMsg ? (
            <p className="text-sm text-muted-foreground">Select a message to see its full trace.</p>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted-foreground">Message ID</div>
                <div className="font-mono text-xs break-all">{selectedMsg.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-muted-foreground">Status</div><Badge variant={statusVariant(selectedMsg.status)}>{selectedMsg.status}</Badge></div>
                <div><div className="text-muted-foreground">Retries</div>{selectedMsg.retry_count}/{selectedMsg.max_retries}</div>
                <div className="col-span-2"><div className="text-muted-foreground">Recipient</div>{selectedMsg.recipient}</div>
                <div className="col-span-2"><div className="text-muted-foreground">Client</div><span className="font-mono">{selectedMsg.client_id}</span></div>
                <div className="col-span-2"><div className="text-muted-foreground">Device</div><span className="font-mono">{selectedMsg.device_id ?? "—"}</span></div>
                <div><div className="text-muted-foreground">Created</div>{fmt(selectedMsg.created_at)}</div>
                <div><div className="text-muted-foreground">Processing</div>{fmt(selectedMsg.processing_at)}</div>
                <div><div className="text-muted-foreground">Sent</div>{fmt(selectedMsg.sent_at)}</div>
                <div><div className="text-muted-foreground">Failed</div>{fmt(selectedMsg.failed_at)}</div>
              </div>
              {selectedMsg.error_message && (
                <div className="text-xs p-2 rounded bg-destructive/10 text-destructive">{selectedMsg.error_message}</div>
              )}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                <ol className="space-y-2 text-xs">
                  <li className="border-l-2 border-primary pl-3">
                    <div className="font-medium">created</div>
                    <div className="text-muted-foreground">{fmt(selectedMsg.created_at)}</div>
                  </li>
                  {selectedEvents.map((e) => (
                    <li key={e.id} className="border-l-2 border-muted pl-3">
                      <div className="font-medium">{e.event_type}</div>
                      <div className="text-muted-foreground">{fmt(e.created_at)}</div>
                      {e.payload && Object.keys(e.payload).length > 0 && (
                        <pre className="text-[10px] mt-1 bg-muted/50 p-1 rounded overflow-auto">{JSON.stringify(e.payload, null, 2)}</pre>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
