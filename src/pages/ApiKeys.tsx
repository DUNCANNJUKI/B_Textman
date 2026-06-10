import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Copy, KeyRound, Trash2, RotateCw, CheckCircle2, ShieldAlert, Clock3, Activity } from "lucide-react";

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const genKey = () => "btx_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

export default function ApiKeys() {
  const { clientId } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ key: string; name: string; rotated?: boolean } | null>(null);
  const [auditThreshold, setAuditThreshold] = useState("1000");
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const load = async () => {
    if (!clientId) return;
    const { data } = await supabase.from("api_keys").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setKeys(data ?? []);
  };
  useEffect(() => { load(); }, [clientId]);

  const create = async () => {
    if (!name.trim() || !clientId) return toast.error("Name required");
    const raw = genKey();
    const hash = await sha256Hex(raw);
    const prefix = raw.slice(0, 10);
    const { error } = await supabase.from("api_keys").insert({ client_id: clientId, name: name.trim(), key_prefix: prefix, key_hash: hash });
    if (error) return toast.error(error.message);
    setCreated({ key: raw, name: name.trim() });
    setName("");
    load();
  };

  const rotate = async (k: any) => {
    const raw = genKey();
    const hash = await sha256Hex(raw);
    const prefix = raw.slice(0, 10);
    const { error } = await supabase.from("api_keys").update({
      key_prefix: prefix, key_hash: hash, status: "active", last_used_at: null, usage_count: 0,
    }).eq("id", k.id);
    if (error) return toast.error(error.message);
    setCreated({ key: raw, name: k.name, rotated: true });
    setOpen(true);
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Revoked"); load(); }
  };

  const openAudit = async (key: any) => {
    setSelectedKey(key);
    setAuditOpen(true);
    const { data, error } = await supabase
      .from("api_key_request_logs")
      .select("*")
      .eq("api_key_id", key.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return toast.error(error.message);
    setAuditLogs(data ?? []);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const copy = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  const suspiciousLimit = Number(auditThreshold) || 1000;
  const activeCount = keys.filter((k) => k.status === "active").length;
  const suspiciousKeys = keys.filter((k) => k.status === "active" && ((k.usage_count ?? 0) >= suspiciousLimit || (!k.last_used_at && (k.usage_count ?? 0) > 0)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">Authenticate external systems and Android device registration. Keys are hashed (SHA-256) — copy once on creation or rotation.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New API key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {created ? <><CheckCircle2 className="h-5 w-5 text-success" /> {created.rotated ? "Key rotated" : "Key created"} — copy now</> : "Create API key"}
              </DialogTitle>
              {created && <DialogDescription>This is the only time the full key will be visible. Store it securely.</DialogDescription>}
            </DialogHeader>
            {created ? (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{created.name}</div>
                <div className="flex gap-2">
                  <Input readOnly value={created.key} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button variant="outline" size="icon" onClick={() => copy(created.key)}><Copy className="h-4 w-4" /></Button>
                </div>
                <div className="rounded-md bg-muted p-3 text-xs font-mono">
                  curl -H "Authorization: Bearer {created.key.slice(0, 12)}…" \<br />
                  &nbsp;&nbsp;https://rtgcrclgmvcmrjpvtpwm.supabase.co/functions/v1/device-register
                </div>
                <DialogFooter><Button onClick={() => { setOpen(false); setCreated(null); }}>Done</Button></DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1"><Label>Key name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Production server / Phone-1" maxLength={100} /></div>
                <DialogFooter><Button onClick={create}>Generate</Button></DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-4 space-y-4">
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Prefix</TableHead><TableHead>Status</TableHead>
              <TableHead>Usage</TableHead><TableHead>Rate limit</TableHead><TableHead>Last used</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {keys.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No API keys yet — create one to register your first Android device.</TableCell></TableRow>}
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground" />{k.name}</TableCell>
                  <TableCell className="font-mono text-xs">{k.key_prefix}…</TableCell>
                  <TableCell>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${k.status === "active" ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}>{k.status}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">{k.usage_count}</TableCell>
                  <TableCell>{k.rate_limit}/min</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "never"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {k.status === "active" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm"><RotateCw className="h-3 w-3 mr-1" />Rotate</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Rotate “{k.name}”?</AlertDialogTitle>
                              <AlertDialogDescription>The old key stops working immediately. Any device still using it will need the new key to re-register.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => rotate(k)}>Rotate now</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {k.status === "active" ? (
                        <Button variant="ghost" size="sm" onClick={() => openAudit(k)}><ShieldAlert className="h-3 w-3 mr-1" />Audit</Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => remove(k.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Audit panel</h2>
            <p className="text-sm text-muted-foreground">Review usage patterns and revoke keys after suspicious activity.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active keys</div>
            <div className="mt-2 text-2xl font-semibold">{activeCount}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Suspicious</div>
            <div className="mt-2 text-2xl font-semibold">{suspiciousKeys.length}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total calls</div>
            <div className="mt-2 text-2xl font-semibold">{keys.reduce((sum, key) => sum + Number(key.usage_count ?? 0), 0)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Suspicious usage threshold</Label>
          <Input type="number" min="1" step="1" value={auditThreshold} onChange={(e) => setAuditThreshold(e.target.value)} />
          <p className="text-xs text-muted-foreground">Keys with at least this many calls are highlighted below.</p>
        </div>

        <div className="space-y-3">
          {keys.map((key) => {
            const suspicious = key.status === "active" && ((key.usage_count ?? 0) >= suspiciousLimit || (!key.last_used_at && (key.usage_count ?? 0) > 0));
            return (
              <div key={key.id} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">{key.name}{suspicious && <Badge variant="destructive">Flagged</Badge>}</div>
                    <div className="text-xs text-muted-foreground font-mono">{key.key_prefix}…</div>
                  </div>
                  {key.status === "active" && suspicious && (
                    <Button size="sm" variant="destructive" onClick={() => openAudit(key)}>Review & revoke</Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Activity className="h-3 w-3" />Calls: <span className="text-foreground">{key.usage_count}</span></div>
                  <div className="flex items-center gap-2"><Clock3 className="h-3 w-3" />Last used: <span className="text-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "never"}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      </div>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>API key audit drilldown</DialogTitle>
            <DialogDescription>{selectedKey?.name} · review recent calls before revoking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Endpoint</TableHead><TableHead>Device</TableHead><TableHead>IP</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {auditLogs.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No recent calls for this key.</TableCell></TableRow>}
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{log.request_method} {log.endpoint_path}</TableCell>
                      <TableCell className="text-xs">{log.device_name || log.device_id || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address || "—"}</TableCell>
                      <TableCell className="text-xs">{log.status_code || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAuditOpen(false)}>Close</Button>
              {selectedKey?.status === "active" && <Button variant="destructive" onClick={async () => { await revoke(selectedKey.id); setAuditOpen(false); }}>Revoke key</Button>}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
