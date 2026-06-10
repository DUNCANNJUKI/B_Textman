import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Copy, Smartphone, CheckCircle2, KeyRound, Radio, Send, Activity, ArrowRight, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SUPABASE_URL = "https://rtgcrclgmvcmrjpvtpwm.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2NyY2xnbXZjbXJqcHZ0cHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTU0NTEsImV4cCI6MjA3MDQzMTQ1MX0.JR45nTPTScLaObpXQM-VzQ50ODRJTzakrvPOA3HldCM";

const ENDPOINTS = {
  register: `${SUPABASE_URL}/functions/v1/device-register`,
  heartbeat: `${SUPABASE_URL}/functions/v1/device-heartbeat`,
  statusUpdate: `${SUPABASE_URL}/functions/v1/device-status-update`,
  realtime: `${SUPABASE_URL}/realtime/v1/websocket`,
};

const STEPS = [
  { id: 1, title: "Create API key", icon: KeyRound },
  { id: 2, title: "Register device", icon: Radio },
  { id: 3, title: "QR / snippet", icon: Smartphone },
  { id: 4, title: "Heartbeat & realtime", icon: Activity },
  { id: 5, title: "Send & report", icon: Send },
];

export default function AndroidClient() {
  const { clientId } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Samsung-A12-Nairobi-1");
  const [phone, setPhone] = useState("+254700000000");
  const [hasKey, setHasKey] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [pollInterval, setPollInterval] = useState(10);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "fallback">("connecting");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // ---- De-dup + ordering ----
  // Status progression rank: terminal states (delivered/failed) cannot be overwritten
  // by a stale "queued"/"processing"/"sent" update arriving out of order.
  const STATUS_RANK: Record<string, number> = {
    queued: 1, processing: 2, sent: 3, delivered: 4, failed: 4,
  };
  // Tracks the highest-rank state we've already applied per message id, so realtime
  // and polled updates can't introduce duplicates or regress a row.
  const seenRef = useRef<Map<string, { rank: number; updated_at: string }>>(new Map());

  const shouldApply = (row: any) => {
    if (!row?.id) return false;
    const incomingRank = STATUS_RANK[row.status] ?? 0;
    const incomingTs = row.updated_at || row.delivered_at || row.sent_at || row.failed_at || row.created_at || "";
    const prev = seenRef.current.get(row.id);
    if (!prev) return true;
    if (incomingRank < prev.rank) return false;                       // status regressed → drop
    if (incomingRank === prev.rank && incomingTs <= prev.updated_at) return false; // duplicate / older
    return true;
  };

  const mergeRows = useCallback((incoming: any[]) => {
    setRecentMessages((prev) => {
      const map = new Map<string, any>(prev.map((m) => [m.id, m]));
      for (const row of incoming) {
        if (!shouldApply(row)) continue;
        map.set(row.id, { ...(map.get(row.id) ?? {}), ...row });
        seenRef.current.set(row.id, {
          rank: STATUS_RANK[row.status] ?? 0,
          updated_at: row.updated_at || row.delivered_at || row.sent_at || row.failed_at || row.created_at || "",
        });
      }
      // newest first by created_at, capped at 20
      return Array.from(map.values())
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 20);
    });
  }, []);

  const loadRecentMessages = useCallback(async () => {
    if (!clientId) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from("messages")
      .select("id,recipient,status,created_at,updated_at,sent_at,delivered_at,failed_at,device_id,error_message")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) mergeRows(data);
    setLoadingMessages(false);
  }, [clientId, mergeRows]);

  // ---- Realtime stream w/ exponential backoff reconnect ----
  // Backoff: 2,4,8,16,30,30… seconds. Each failed subscribe bumps reconnectAttempt,
  // which schedules the next attempt — never spams the gateway with rapid retries.
  useEffect(() => {
    if (!clientId) return;
    loadRecentMessages();
    let cancelled = false;
    let openTimer: number | undefined;
    setRealtimeStatus((s) => (s === "live" ? "connecting" : s));

    const channel = supabase
      .channel(`android-client-msgs-${clientId}-${reconnectAttempt}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
        (payload: any) => {
          const row = (payload.new ?? payload.old);
          if (row) mergeRows([row]);
        },
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
          if (openTimer) { clearTimeout(openTimer); openTimer = undefined; }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("fallback");
          // schedule next reconnect with exponential backoff (cap 30s)
          const delay = Math.min(30_000, 2_000 * Math.pow(2, reconnectAttempt));
          window.setTimeout(() => { if (!cancelled) setReconnectAttempt((n) => n + 1); }, delay);
        }
      });

    // 10s open guard — if we never see SUBSCRIBED, treat as fallback and schedule retry
    openTimer = window.setTimeout(() => {
      setRealtimeStatus((s) => {
        if (s === "live") return s;
        const delay = Math.min(30_000, 2_000 * Math.pow(2, reconnectAttempt));
        window.setTimeout(() => { if (!cancelled) setReconnectAttempt((n) => n + 1); }, delay);
        return "fallback";
      });
    }, 10_000);

    return () => {
      cancelled = true;
      if (openTimer) clearTimeout(openTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, reconnectAttempt]);

  // ---- Polling fallback ----
  // Only runs when realtime is NOT live and autoPoll is on. Auto-pauses on hidden tab.
  useEffect(() => {
    if (!autoPoll || !clientId || realtimeStatus === "live") return;
    let timer: number | undefined;
    const tick = () => { if (!document.hidden) loadRecentMessages(); };
    const start = () => { timer = window.setInterval(tick, Math.max(2, pollInterval) * 1000); };
    const stop = () => { if (timer) { clearInterval(timer); timer = undefined; } };
    const onVis = () => { stop(); if (!document.hidden) { tick(); start(); } };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPoll, pollInterval, clientId, realtimeStatus]);




  useEffect(() => {
    if (!clientId) return;
    supabase.from("api_keys").select("id").eq("client_id", clientId).eq("status", "active").limit(1)
      .then(({ data }) => setHasKey((data?.length ?? 0) > 0));
    supabase.from("devices").select("id,device_name,device_token").eq("client_id", clientId).order("created_at", { ascending: false })
      .then(({ data }) => {
        setDevices(data ?? []);
        setSelectedToken((data?.[0]?.device_token as string) ?? "");
      });
  }, [clientId]);

  const activationBundle = useMemo(() => JSON.stringify({
    device_name: name,
    device_token: selectedToken,
    supabase_url: SUPABASE_URL,
    supabase_anon_key: ANON_KEY,
    register_endpoint: ENDPOINTS.register,
    heartbeat_endpoint: ENDPOINTS.heartbeat,
    status_update_endpoint: ENDPOINTS.statusUpdate,
  }, null, 2), [name, selectedToken]);

  useEffect(() => {
    if (!selectedToken) return void setQrCode("");
    QRCode.toDataURL(activationBundle, { margin: 1, width: 240 }).then(setQrCode).catch(() => setQrCode(""));
  }, [activationBundle, selectedToken]);

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  const validateHeartbeat = async () => {
    if (!selectedToken) return toast.error("Select a device token first");
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(ENDPOINTS.heartbeat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${selectedToken}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ app_version: "wizard-check", battery_level: 100, signal_strength: 4, internet_type: "wizard" }),
      });
      const data = await res.json().catch(() => ({}));
      setValidationResult({ ok: res.ok, status: res.status, data });
      if (res.ok) toast.success("Heartbeat check passed"); else toast.error(data?.error || `Heartbeat failed (${res.status})`);
    } catch (error) {
      setValidationResult({ ok: false, status: 0, data: { error: error instanceof Error ? error.message : "Request failed" } });
      toast.error("Heartbeat validation failed");
    } finally {
      setValidating(false);
    }
  };

  
          ArrayList(List(parts.size) { sentPI }),
          ArrayList(List(parts.size) { delivPI }))
      } else {
        sms.sendTextMessage(to, null, text, sentPI, delivPI)
      }
    } catch (e: Exception) {
      scope.launch { reportStatus(token, id, "failed", e.message) }
    }
  }

  /** 4) STATUS update back to server — POSTed after every successful sendTextMessage.
   *  If the POST fails (no network, 5xx, timeout) the id+status is persisted to disk
   *  and replayed on the next heartbeat, repeatedly, until the server acknowledges. */
  suspend fun reportStatus(token: String, messageId: String, status: String, err: String? = null) {
    val ok = runCatching {
      val res = HttpClient(Android).post("${ENDPOINTS.statusUpdate}") {
        header("Authorization", "Bearer \$token")
        contentType(ContentType.Application.Json)
        setBody("""{"message_id":"\$messageId","status":"\$status","error_message":\${err?.let { "\\"\$it\\"" } ?: "null"}}""")
      }
      res.status.value in 200..299
    }.getOrDefault(false)

    if (!ok) {
      // persistent retry queue — survives process death
      val pending = prefs.getStringSet("pending_status", mutableSetOf())!!.toMutableSet()
      pending.add("\$messageId|\$status|\${err ?: ""}")
      prefs.edit().putStringSet("pending_status", pending).apply()
      if (status == "sent" || status == "delivered") deliveredBuffer.add(messageId)
    } else {
      // success — drop any earlier pending entry for this id
      val pending = prefs.getStringSet("pending_status", mutableSetOf())!!.toMutableSet()
      pending.removeAll { it.startsWith("\$messageId|") }
      prefs.edit().putStringSet("pending_status", pending).apply()
    }
  }

  /** Called from startHeartbeat() before each heartbeat fires. Replays every persisted
   *  status update; entries that succeed are removed, the rest stay for the next tick. */
  private suspend fun flushPendingStatuses(token: String) {
    val pending = prefs.getStringSet("pending_status", mutableSetOf())!!.toMutableSet()
    if (pending.isEmpty()) return
    val acked = mutableSetOf<String>()
    for (entry in pending) {
      val (id, status, err) = entry.split("|", limit = 3).let { Triple(it[0], it[1], it.getOrNull(2)) }
      val ok = runCatching {
        HttpClient(Android).post("${ENDPOINTS.statusUpdate}") {
          header("Authorization", "Bearer \$token")
          contentType(ContentType.Application.Json)
          setBody("""{"message_id":"\$id","status":"\$status","error_message":\${if (err.isNullOrBlank()) "null" else "\\"\$err\\""}}""")
        }.status.value in 200..299
      }.getOrDefault(false)
      if (ok) acked.add(entry)
    }
    if (acked.isNotEmpty()) {
      pending.removeAll(acked)
      prefs.edit().putStringSet("pending_status", pending).apply()
    }
  }
}`;


  const ManifestRow = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 rounded-md bg-muted text-xs break-all">{value}</code>
        <Button size="icon" variant="outline" onClick={() => copy(value)}><Copy className="h-3 w-3" /></Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-gradient-primary flex items-center justify-center shadow-glow">
          <Smartphone className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Android Gateway Setup</h1>
          <p className="text-sm text-muted-foreground">First-run wizard for connecting a physical Android phone with a SIM card.</p>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1 min-w-[140px]">
                <button onClick={() => setStep(s.id)} className={`h-9 w-9 rounded-full flex items-center justify-center border ${done ? "bg-success text-success-foreground border-success" : active ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-muted border-border text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </button>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {s.id}</div>
                  <div className="text-sm font-medium">{s.title}</div>
                </div>
                {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground hidden md:block" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step content */}
      {step === 1 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">1. Create an API key</h2>
            {hasKey ? <Badge>You already have an active key</Badge> : <Badge variant="secondary">No active key yet</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">The Android app uses an API key once during first-run to call <code>/device-register</code>. The server returns a permanent <strong>device token</strong> that replaces it for every subsequent call.</p>
          <div className="flex gap-2">
            <a href="/api-keys"><Button><KeyRound className="h-4 w-4 mr-1" />Open API Keys</Button></a>
            <Button variant="outline" onClick={() => setStep(2)}>I have a key — next<ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">2. Register the device</h2>
          <p className="text-sm text-muted-foreground">On first run, the app POSTs to <code>/device-register</code> with the API key as <code>Bearer</code>. The response contains <code>device_token</code> — save it in <code>SharedPreferences</code> and use it for every subsequent call.</p>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Device name (suggestion)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone number (E.164)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <ManifestRow label="Endpoint" value={ENDPOINTS.register} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sample cURL</div>
              <pre className="text-[11px] bg-muted rounded p-3 overflow-auto"><code>{`curl -X POST ${ENDPOINTS.register} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ device_name: name, phone_number: phone, sim_slot: 1, android_version: "14", app_version: "1.0" })}'`}</code></pre>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Expected response</div>
              <pre className="text-[11px] bg-muted rounded p-3 overflow-auto"><code>{`{
  "device_id": "uuid",
  "device_token": "dt_xxxxxxxxxxxxxxxxxxxxxxxx",   // store this in SharedPreferences
  "client_id": "uuid"
}`}</code></pre>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">3. QR code / manual activation bundle</h2>
          <p className="text-sm text-muted-foreground">For Android apps that expect manual setup like your screenshots, use these exact fields: <strong>Device name</strong>, <strong>Device token</strong>, <strong>Supabase URL</strong>, and <strong>Supabase anon key</strong>. The token comes from an existing device record or from the <code>/device-register</code> response.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Existing device token</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
                  <option value="">Select a device token</option>
                  {devices.map((device) => <option key={device.id} value={device.device_token}>{device.device_name}</option>)}
                </select>
              </div>
              <ManifestRow label="Supabase URL" value={SUPABASE_URL} />
              <ManifestRow label="Supabase anon key" value={ANON_KEY} />
            </div>
            <div className="space-y-3">
              {qrCode ? <img src={qrCode} alt="Android activation QR" className="h-60 w-60 rounded-md border border-border bg-white p-2" /> : <div className="h-60 w-60 rounded-md border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">Select a device token to generate QR</div>}
              <Button variant="outline" onClick={() => copy(activationBundle)}>Copy setup snippet</Button>
            </div>
          </div>

          <pre className="text-[11px] bg-muted rounded p-3 overflow-auto max-h-56"><code>{activationBundle}</code></pre>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => setStep(4)}>Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">3. Background heartbeat &amp; realtime subscription</h2>
          <p className="text-sm text-muted-foreground">Run a foreground <code>Service</code> that (a) sends a heartbeat every 30s and (b) subscribes to Realtime <code>postgres_changes</code> on <code>public.messages</code> filtered to this device's channel.</p>

          <ManifestRow label="Heartbeat endpoint (POST, Bearer = device_token)" value={ENDPOINTS.heartbeat} />
          <ManifestRow label="Realtime websocket" value={ENDPOINTS.realtime} />
          <ManifestRow label="Supabase URL" value={SUPABASE_URL} />
          <ManifestRow label="Supabase anon key" value={ANON_KEY} />

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Heartbeat payload</div>
            <pre className="text-[11px] bg-muted rounded p-3 overflow-auto"><code>{`{
  "battery_level": 87,
  "signal_strength": 4,
  "internet_type": "wifi",
  "app_version": "1.0"
}`}</code></pre>
          </div>

          <div className="rounded-md border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium">Live connection check</div>
                <p className="text-sm text-muted-foreground">Before finishing setup, confirm this token can reach <code>/device-heartbeat</code> and receive queued payloads.</p>
              </div>
              <Button onClick={validateHeartbeat} disabled={validating || !selectedToken}>
                {validating ? "Checking…" : "Validate heartbeat"}
              </Button>
            </div>
            {validationResult && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={validationResult.ok ? "default" : "destructive"}>HTTP {validationResult.status || "ERR"}</Badge>
                  <span className="text-muted-foreground">{validationResult.ok ? "Gateway reachable" : "Fix token or endpoint before finishing"}</span>
                </div>
                <pre className="text-[11px] bg-muted rounded p-3 overflow-auto max-h-48"><code>{JSON.stringify(validationResult.data, null, 2)}</code></pre>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button onClick={() => setStep(5)}>Next<ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">4. Send the SMS &amp; report status</h2>
          <p className="text-sm text-muted-foreground">When the realtime channel fires an <code>INSERT</code> on <code>messages</code>, call <code>SmsManager.sendTextMessage()</code>, then POST the result back so the server can fire <code>message.sent</code> / <code>message.failed</code> webhooks.</p>

          <ManifestRow label="Status update endpoint" value={ENDPOINTS.statusUpdate} />

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Status update payload</div>
            <pre className="text-[11px] bg-muted rounded p-3 overflow-auto"><code>{`{
  "message_id": "uuid-from-realtime-event",
  "status": "sent" | "delivered" | "failed",
  "error_message": null
}`}</code></pre>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <CheckCircle2 className="inline h-4 w-4 text-success mr-1" />
              You're done — open <a href="/devices" className="underline text-primary">Devices</a> to watch the new phone come online.
            </div>
            <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
          </div>
        </Card>
      )}

      {/* Delivery status widget — last 20 messages */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Delivery status (last 20)</h2>
            <p className="text-xs text-muted-foreground">Live feed of message IDs, state, timestamps and failure reasons. Auto-pauses when the tab is hidden.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant={realtimeStatus === "live" ? "default" : realtimeStatus === "fallback" ? "destructive" : "secondary"} className="gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${realtimeStatus === "live" ? "bg-success animate-pulse" : realtimeStatus === "fallback" ? "bg-destructive" : "bg-muted-foreground"}`} />
              {realtimeStatus === "live" ? "Realtime" : realtimeStatus === "fallback" ? "Polling (fallback)" : "Connecting…"}
            </Badge>
            <label className="flex items-center gap-1" title={realtimeStatus === "live" ? "Polling disabled while realtime is connected" : ""}>
              <input type="checkbox" checked={autoPoll} onChange={(e) => setAutoPoll(e.target.checked)} disabled={realtimeStatus === "live"} />
              Auto-poll
            </label>
            <Input
              type="number"
              min={2}
              max={300}
              value={pollInterval}
              onChange={(e) => setPollInterval(Math.max(2, Number(e.target.value) || 10))}
              className="h-8 w-20"
              disabled={!autoPoll || realtimeStatus === "live"}
            />
            <span className="text-muted-foreground">sec</span>
            <Button size="sm" variant="outline" onClick={loadRecentMessages} disabled={loadingMessages}>
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingMessages ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>
        </div>
        {recentMessages.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-md">No messages yet.</div>
        ) : (
          <div className="overflow-auto max-h-[420px] rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr className="text-left">
                  <th className="p-2 font-semibold">Message ID</th>
                  <th className="p-2 font-semibold">Recipient</th>
                  <th className="p-2 font-semibold">Status</th>
                  <th className="p-2 font-semibold">Failure reason</th>
                  <th className="p-2 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentMessages.map((m) => {
                  const ts = m.delivered_at || m.sent_at || m.failed_at || m.created_at;
                  const variant: any = m.status === "delivered" || m.status === "sent" ? "default"
                    : m.status === "failed" ? "destructive" : "secondary";
                  return (
                    <tr key={m.id} className="border-t border-border hover:bg-muted/50 align-top">
                      <td className="p-2 font-mono text-[10px]">
                        <button onClick={() => copy(m.id)} className="hover:underline" title="Copy ID">{m.id.slice(0, 8)}…</button>
                      </td>
                      <td className="p-2">{m.recipient}</td>
                      <td className="p-2"><Badge variant={variant}>{m.status}</Badge></td>
                      <td className="p-2 max-w-[280px]">
                        {m.status === "failed" ? (
                          <span className="text-destructive break-words" title={m.error_message || "unknown error"}>
                            {m.error_message || "unknown error"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap" title={new Date(ts).toLocaleString()}>
                        {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* App-generator sync prompt and Kotlin reference removed as requested */}
    </div>
  );
}

// App generator prompt removed per request

