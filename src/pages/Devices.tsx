import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Smartphone, Plus, Search, Copy, Battery, Signal, Wifi } from "lucide-react";

export default function Devices() {
  const { clientId, roles } = useAuth();
  const admin = isAdmin(roles);
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const load = async () => {
    if (!admin && !clientId) {
      setDevices([]);
      return;
    }
    const base = supabase.from("devices").select("*");
    const q = admin ? base : base.eq("client_id", clientId as string);
    const { data } = await q.order("created_at", { ascending: false });
    setDevices(data ?? []);
  };

  useEffect(() => {
    load();
    if (admin || clientId) {
      const ch = supabase.channel("devices-feed")
        .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, load)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
    return;
  }, [clientId, admin]);

  const create = async () => {
    if (!name.trim()) return toast.error("Name required");
    if (!clientId) return toast.error("No client found");
    const token = "dev_" + crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("devices").insert({
      client_id: clientId, device_name: name, phone_number: phone, device_token: token, status: "offline",
    });
    if (error) return toast.error(error.message);
    setCreatedToken(token);
    setName(""); setPhone("");
    toast.success("Device registered");
  };

  const toggle = async (d: any) => {
    const next = d.status === "disabled" ? "offline" : "disabled";
    const { error } = await supabase.from("devices").update({ status: next }).eq("id", d.id);
    if (error) toast.error(error.message);
  };

  const filtered = devices.filter((d) =>
    !search || d.device_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone_number?.includes(search) || d.sim_operator?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Devices</h1><p className="text-sm text-muted-foreground">Android gateway phones</p></div>
        <div>
          {/* Device registration is handled via API keys/device-register function — provide guidance */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled title="Devices are added via API keys">Register device</Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Devices are registered via API keys. See <a href="/api-docs" className="underline">API docs</a> or <a href="/api-keys" className="underline">API keys</a> to create a key.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, number, operator..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Device</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead>
              <TableHead>Battery</TableHead><TableHead>Signal</TableHead><TableHead>Sent</TableHead>
              <TableHead>Failed</TableHead><TableHead>Last seen</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No devices yet — register one to start sending SMS.</TableCell></TableRow>}
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell><Link to={`/devices/${d.id}`} className="flex items-center gap-2 hover:text-primary"><Smartphone className="h-4 w-4" />{d.device_name}</Link></TableCell>
                  <TableCell className="font-mono text-xs">{d.phone_number ?? "—"}</TableCell>
                  <TableCell><DeviceStatus s={d.status} /></TableCell>
                  <TableCell><span className="flex items-center gap-1 text-sm"><Battery className="h-3 w-3" />{d.battery_level ?? 0}%</span></TableCell>
                  <TableCell><span className="flex items-center gap-1 text-sm"><Signal className="h-3 w-3" />{d.signal_strength ?? 0}</span></TableCell>
                  <TableCell className="tabular-nums">{d.total_sms_sent}</TableCell>
                  <TableCell className="tabular-nums">{d.total_sms_failed}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.last_seen ? new Date(d.last_seen).toLocaleString() : "never"}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => toggle(d)}>{d.status === "disabled" ? "Enable" : "Disable"}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function DeviceStatus({ s }: { s: string }) {
  const map: Record<string, { c: string; label: string }> = {
    online: { c: "bg-success/15 text-success border-success/30", label: "online" },
    offline: { c: "bg-muted text-muted-foreground border-border", label: "offline" },
    sending: { c: "bg-primary/15 text-primary border-primary/30", label: "sending" },
    inactive: { c: "bg-warning/15 text-warning border-warning/30", label: "inactive" },
    disabled: { c: "bg-destructive/15 text-destructive border-destructive/30", label: "disabled" },
  };
  const v = map[s] ?? map.offline;
  return <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${v.c}`}>
    {s === "online" || s === "sending" ? <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" /> : null}
    {v.label}
  </span>;
}
