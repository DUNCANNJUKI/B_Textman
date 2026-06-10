import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Trash2, Send, Eye, EyeOff, Copy, FlaskConical, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";

const EVENTS = ["message.sent", "message.delivered", "message.failed", "test.ping"];
const SAMPLE_PAYLOADS: Record<string, object> = {
  "message.sent": { message_id: "msg_123", recipient: "+254700000000", status: "sent", sent_at: new Date().toISOString() },
  "message.delivered": { message_id: "msg_123", recipient: "+254700000000", status: "delivered", delivered_at: new Date().toISOString() },
  "message.failed": { message_id: "msg_123", recipient: "+254700000000", status: "failed", error: "Network error" },
  "test.ping": { message: "Hello from B-TEXTMAN", at: new Date().toISOString() },
};
const schema = z.object({ url: z.string().url("Must be a valid URL").max(500) });

export default function Webhooks() {
  const { clientId } = useAuth();
  const [hooks, setHooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["message.sent", "message.delivered", "message.failed"]);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // Console state
  const [consoleHookId, setConsoleHookId] = useState<string>("");
  const [consoleEvent, setConsoleEvent] = useState<string>("test.ping");
  const [consolePayload, setConsolePayload] = useState<string>(JSON.stringify(SAMPLE_PAYLOADS["test.ping"], null, 2));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    if (!clientId) return;
    const { data } = await supabase.from("webhooks").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setHooks(data ?? []);
    if (data?.length && !consoleHookId) setConsoleHookId(data[0].id);
    setHistoryPage(0);
  };

  useEffect(() => { load(); }, [clientId]);

  useEffect(() => {
    const loadDeliveries = async () => {
      const ids = hooks.map((h) => h.id);
      if (!ids.length) return setDeliveries([]);
      const from = historyPage * historyPageSize;
      const to = from + historyPageSize - 1;
      const { data, count } = await supabase
        .from("webhook_deliveries")
        .select("*", { count: "exact" })
        .in("webhook_id", ids)
        .order("created_at", { ascending: false })
        .range(from, to);
      setDeliveries(data ?? []);
      setDeliveryCount(count ?? 0);
    };
    loadDeliveries();
  }, [hooks, historyPage, historyPageSize]);

  useEffect(() => {
    if (SAMPLE_PAYLOADS[consoleEvent]) {
      setConsolePayload(JSON.stringify(SAMPLE_PAYLOADS[consoleEvent], null, 2));
    }
  }, [consoleEvent]);

  const create = async () => {
    const v = schema.safeParse({ url });
    if (!v.success) return toast.error(v.error.issues[0].message);
    if (!clientId) return;
    const { error } = await supabase.from("webhooks").insert({ client_id: clientId, url, events });
    if (error) return toast.error(error.message);
    toast.success("Webhook created");
    setUrl(""); setOpen(false); load();
  };

  const toggle = async (h: any) => { await supabase.from("webhooks").update({ active: !h.active }).eq("id", h.id); load(); };
  const remove = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    await supabase.from("webhooks").delete().eq("id", id); load();
  };
  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  const runConsole = async () => {
    if (!consoleHookId) return toast.error("Pick a webhook");
    let payload: any;
    try { payload = JSON.parse(consolePayload); } catch { return toast.error("Payload is not valid JSON"); }
    setRunning(true); setResult(null);
    const { data, error } = await supabase.functions.invoke("webhook-test", {
      body: { webhook_id: consoleHookId, event_type: consoleEvent, payload },
    });
    setRunning(false);
    if (error) return toast.error(error.message);
    setResult(data);
    toast.success(data?.ok ? `Delivered in ${data.duration_ms}ms` : `Failed (HTTP ${data?.response?.status || "ERR"})`);
    load();
  };

  const retryDelivery = async (delivery: any) => {
    const hook = hooks.find((item) => item.id === delivery.webhook_id);
    if (!hook) return toast.error("Webhook no longer exists");
    setRetryingId(delivery.id);
    const { data, error } = await supabase.functions.invoke("webhook-test", {
      body: {
        webhook_id: hook.id,
        event_type: delivery.event_type,
        payload: delivery.payload,
      },
    });
    setRetryingId(null);
    if (error) return toast.error(error.message);
    toast.success(data?.ok ? `Retry delivered (attempt ${data?.delivery?.attempt ?? "?"})` : "Retry recorded");
    if (consoleHookId === hook.id) setResult(data);
    load();
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(deliveryCount / historyPageSize)), [deliveryCount, historyPageSize]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Receive realtime delivery callbacks. Signed with HMAC-SHA256 via <code className="text-xs">X-BTextman-Signature</code>.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New webhook</Button>
      </div>

      <div className="grid gap-3">
        {hooks.length === 0 && <Card className="p-8 text-center text-muted-foreground">No webhooks yet.</Card>}
        {hooks.map((h) => (
          <Card key={h.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm truncate">{h.url}</code>
                  <Badge variant={h.active ? "default" : "secondary"}>{h.active ? "active" : "paused"}</Badge>
                  {h.last_status ? <Badge variant={h.last_status < 400 ? "default" : "destructive"}>HTTP {h.last_status}</Badge> : null}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Events: {(h.events ?? []).join(", ")}</div>
                <div className="text-xs mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground">Secret:</span>
                  <code className="font-mono">{showSecret[h.id] ? h.secret : "•".repeat(24)}</code>
                  <button onClick={() => setShowSecret((s) => ({ ...s, [h.id]: !s[h.id] }))}>
                    {showSecret[h.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button onClick={() => copy(h.secret)}><Copy className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={h.active} onCheckedChange={() => toggle(h)} />
                <Button size="sm" variant="outline" onClick={() => { setConsoleHookId(h.id); document.getElementById("wh-console")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <FlaskConical className="h-3 w-3 mr-1" />Test
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* === Test Console === */}
      <Card id="wh-console" className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Test console</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Webhook</Label>
              <Select value={consoleHookId} onValueChange={setConsoleHookId}>
                <SelectTrigger><SelectValue placeholder="Pick a webhook" /></SelectTrigger>
                <SelectContent>{hooks.map((h) => <SelectItem key={h.id} value={h.id}>{h.url}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Event type</Label>
              <Select value={consoleEvent} onValueChange={setConsoleEvent}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payload (JSON)</Label>
              <Textarea value={consolePayload} onChange={(e) => setConsolePayload(e.target.value)} rows={10} className="font-mono text-xs" />
            </div>
            <Button onClick={runConsole} disabled={running || !consoleHookId}>
              {running ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-1" />Send event</>}
            </Button>
          </div>

          <div className="space-y-3">
            {!result && <div className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-md">Run a test to see the signature, request and response here.</div>}
            {result && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={result.ok ? "default" : "destructive"}>HTTP {result.response?.status || "ERR"}</Badge>
                  <span className="text-xs text-muted-foreground">{result.duration_ms}ms</span>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Signature</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] break-all bg-muted p-2 rounded">{result.signature}</code>
                    <Button size="icon" variant="outline" onClick={() => copy(result.signature)}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Request body</div>
                  <pre className="text-[10px] bg-muted p-2 rounded max-h-40 overflow-auto"><code>{result.request?.body}</code></pre>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Response</div>
                  <pre className="text-[10px] bg-muted p-2 rounded max-h-40 overflow-auto"><code>{result.response?.body || result.response?.error || "(empty)"}</code></pre>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">Delivery history</h2>
          <div className="flex items-center gap-2">
            <Select value={String(historyPageSize)} onValueChange={(v) => { setHistoryPage(0); setHistoryPageSize(Number(v)); }}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size}/page</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))} disabled={historyPage === 0}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-xs text-muted-foreground min-w-[90px] text-center">Page {historyPage + 1} / {totalPages}</div>
            <Button size="icon" variant="outline" onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))} disabled={historyPage + 1 >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <ScrollArea className="h-80 rounded-md border border-border">
          <div className="space-y-1 text-xs p-2">
          {deliveries.length === 0 && <div className="text-muted-foreground">No deliveries yet.</div>}
          {deliveries.map((d) => (
            <div
              key={d.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(d)}
              onKeyDown={(e) => { if (e.key === "Enter") setDetail(d); }}
              className="flex items-center gap-2 py-2 border-b border-border/40 cursor-pointer hover:bg-muted/40 rounded px-1"
            >
              <Badge variant={d.succeeded ? "default" : "destructive"} className="shrink-0">{d.response_status || "ERR"}</Badge>
              <span className="font-mono shrink-0">{d.event_type}</span>
              <Badge variant="secondary" className="shrink-0">Attempt {d.attempt ?? 1}</Badge>
              <span className="text-muted-foreground truncate">{d.response_body?.slice(0, 100)}</span>
              <div className="ml-auto flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {!d.succeeded && (
                <Button size="sm" variant="outline" disabled={retryingId === d.id} onClick={() => retryDelivery(d)}>
                  {retryingId === d.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}Retry
                </Button>
              )}
              <span className="text-muted-foreground shrink-0">{new Date(d.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground">Newest deliveries first. Each retry is stored as a new attempt.</div>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              Delivery attempt
              {detail && <Badge variant={detail.succeeded ? "default" : "destructive"}>HTTP {detail.response_status ?? "ERR"}</Badge>}
              {detail && <Badge variant="secondary">Attempt {detail.attempt ?? 1}</Badge>}
              {detail?.duration_ms != null && <Badge variant="outline">{detail.duration_ms}ms</Badge>}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-4 text-xs">
                <DetailRow label="Event" value={detail.event_type} onCopy={copy} />
                <DetailRow label="Target URL" value={detail.target_url ?? ""} onCopy={copy} />
                <DetailRow label="Timestamp" value={new Date(detail.created_at).toLocaleString()} onCopy={copy} />
                {detail.delivered_at && <DetailRow label="Delivered at" value={new Date(detail.delivered_at).toLocaleString()} onCopy={copy} />}
                {detail.request_signature && <DetailRow label="Signature" value={detail.request_signature} onCopy={copy} mono />}
                <DetailBlock label="Request headers" json={detail.request_headers} onCopy={copy} />
                <DetailBlock label="Request body" json={detail.request_body ?? detail.payload} onCopy={copy} />
                <DetailBlock label="Response headers" json={detail.response_headers} onCopy={copy} />
                <DetailBlock label="Response body" text={detail.response_body ?? "(empty)"} onCopy={copy} />
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="gap-2">
            {detail && !detail.succeeded && (
              <Button variant="outline" onClick={() => { retryDelivery(detail); setDetail(null); }}>
                <RefreshCw className="h-3 w-3 mr-1" />Retry now
              </Button>
            )}
            <Button onClick={() => setDetail(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Endpoint URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/btextman" /></div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={events.includes(ev)} onChange={(e) => setEvents((arr) => e.target.checked ? [...arr, ev] : arr.filter((x) => x !== ev))} />
                    <code>{ev}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: (s: string) => void; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
        <span>{label}</span>
        <button onClick={() => onCopy(value)} className="hover:text-foreground"><Copy className="h-3 w-3" /></button>
      </div>
      <div className={`bg-muted p-2 rounded break-all ${mono ? "font-mono text-[10px]" : ""}`}>{value}</div>
    </div>
  );
}

function DetailBlock({ label, json, text, onCopy }: { label: string; json?: any; text?: string; onCopy: (s: string) => void }) {
  const display = text !== undefined ? text : (() => { try { return JSON.stringify(json ?? {}, null, 2); } catch { return String(json ?? ""); } })();
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
        <span>{label}</span>
        <button onClick={() => onCopy(display)} className="hover:text-foreground"><Copy className="h-3 w-3" /></button>
      </div>
      <pre className="text-[10px] bg-muted p-2 rounded max-h-48 overflow-auto"><code>{display}</code></pre>
    </div>
  );
}
