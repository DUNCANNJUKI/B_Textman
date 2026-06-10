import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export default function Logs() {
  const { clientId, roles } = useAuth();
  const admin = isAdmin(roles);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      // device logs joined visually with message events not feasible cheaply — fetch both
      const devLogQ = supabase.from("device_logs").select("*").order("created_at", { ascending: false }).limit(200);
      const msgEvtQ = supabase.from("message_events").select("*").order("created_at", { ascending: false }).limit(200);
      const [{ data: dl }, { data: me }] = await Promise.all([devLogQ, msgEvtQ]);
      const merged = [
        ...(dl ?? []).map((d: any) => ({ ...d, kind: "device" })),
        ...(me ?? []).map((m: any) => ({ ...m, kind: "message" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEvents(merged);
    };
    load();
    const ch = supabase.channel("logs-feed").on("postgres_changes", { event: "*", schema: "public", table: "device_logs" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_events" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, admin]);

  const filtered = events.filter((e) => !search || e.event_type?.toLowerCase().includes(search.toLowerCase()) || JSON.stringify(e.payload ?? {}).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Logs</h1><p className="text-sm text-muted-foreground">Device & message events</p></div>
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search event type or payload" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Kind</TableHead><TableHead>Event</TableHead><TableHead>Payload</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No events</TableCell></TableRow>}
              {filtered.slice(0, 200).map((e) => (
                <TableRow key={`${e.kind}-${e.id}`}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
                  <TableCell><span className="text-[10px] px-2 py-0.5 rounded border bg-muted uppercase">{e.kind}</span></TableCell>
                  <TableCell className="font-medium">{e.event_type}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-md truncate">{e.payload ? JSON.stringify(e.payload) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
