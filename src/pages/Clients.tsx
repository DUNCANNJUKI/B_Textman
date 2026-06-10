import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Clients() {
  const { roles } = useAuth();
  const admin = isAdmin(roles);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!admin) return;
    supabase.from("clients").select("*").order("created_at", { ascending: false }).then(({ data }) => setClients(data ?? []));
  }, [admin]);

  if (!admin) return <p className="text-sm text-muted-foreground">Admin only.</p>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Clients</h1><p className="text-sm text-muted-foreground">Tenant accounts</p></div>
      <Card className="p-4">
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Quota</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>
              {clients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No clients</TableCell></TableRow>}
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell className="tabular-nums">{c.monthly_quota}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
