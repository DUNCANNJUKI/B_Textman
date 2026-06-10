import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Database, Download } from "lucide-react";
import { isAdmin } from "@/lib/auth";

export default function Settings() {
  const { user, clientId, roles, refreshRoles } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSuperAdmin, setHasSuperAdmin] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showMessages, setShowMessages] = useState<boolean>(() => {
    try { return localStorage.getItem("showMessages") === "true"; } catch { return false; }
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => setDisplayName(data?.display_name ?? ""));
    if (clientId) supabase.from("clients").select("name").eq("id", clientId).maybeSingle().then(({ data }) => setCompany(data?.name ?? ""));
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin")
      .then(({ count }) => setHasSuperAdmin((count ?? 0) > 0));
  }, [user, clientId]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from("profiles").upsert({ user_id: user.id, display_name: displayName });
      if (clientId) await supabase.from("clients").update({ name: company }).eq("id", clientId);
      toast.success("Saved");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e)); } finally { setLoading(false); }
  };

  const claimSuperAdmin = async () => {
    setClaiming(true);
    try {
      const { error } = await supabase.functions.invoke("claim-super-admin", { body: {} });
      if (error) throw error;
      toast.success("You are now super admin. Refreshing…");
      await refreshRoles();
      setHasSuperAdmin(true);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : String(e) ?? "Failed to claim"); } finally { setClaiming(false); }
  };

  const isSuper = roles.includes("super_admin");

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground">Account & profile</p></div>

      <Card className="p-5 space-y-4">
        <div className="space-y-1"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-1"><Label>Display name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
        <div className="space-y-1"><Label>Company / account name</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
        <div className="space-y-1">
          <Label>Roles</Label>
          <div className="flex gap-2 flex-wrap">
            {(roles.length ? roles : ["client_user"]).map((r) => <Badge key={r} variant={r === "super_admin" ? "default" : "secondary"}>{r}</Badge>)}
          </div>
        </div>
        <Button onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
      </Card>

      <Card className="p-5 space-y-3 border-primary/40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Super admin</h2>
        </div>
        {isSuper ? (
          <p className="text-sm text-muted-foreground">You already have <Badge>super_admin</Badge>.</p>
        ) : hasSuperAdmin === false ? (
          <>
            <p className="text-sm text-muted-foreground">No super admin exists yet. You can claim it for your account now (one-time, first-come).</p>
            <Button onClick={claimSuperAdmin} disabled={claiming}>{claiming ? "Promoting…" : "Promote me to super admin"}</Button>
          </>
        ) : hasSuperAdmin === true ? (
          <p className="text-sm text-muted-foreground">A super admin already exists. Ask them to grant you the role under <em>Clients → Roles</em>.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Checking…</p>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">UI options</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Show messages</Label>
            <p className="text-xs text-muted-foreground">Hide the messages list by default. Enable to view messages under the Messages page.</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch checked={showMessages} onCheckedChange={(v) => { setShowMessages(!!v); try { localStorage.setItem("showMessages", v ? "true" : "false"); } catch {} }} />
            </TooltipTrigger>
            <TooltipContent side="left">Toggle messages visibility</TooltipContent>
          </Tooltip>
        </div>
      </Card>

      {isAdmin(roles) && (
        <Card className="p-5 space-y-3 border-primary/40">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">MySQL schema export</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Download <code className="text-xs">My_mysql_db.sql</code> — a full MySQL 8.0 schema dump
            (database name: <code className="text-xs">My_mysql_db</code>) mirroring all 13 public tables:
            clients, profiles, user_roles, devices, device_logs, messages, message_events,
            bulk_campaigns, api_keys, api_key_request_logs, webhooks, webhook_deliveries, settings.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <a href="/My_mysql_db.sql" download="My_mysql_db.sql">
                <Download className="h-4 w-4 mr-2" /> Download My_mysql_db.sql
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="/My_mysql_db.sql" target="_blank" rel="noreferrer">View</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
