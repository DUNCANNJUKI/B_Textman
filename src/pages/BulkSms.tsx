import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Send } from "lucide-react";

export default function BulkSms() {
  const { clientId } = useAuth();
  const [rows, setRows] = useState<{ recipient: string; message?: string }[]>([]);
  const [template, setTemplate] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFile = (f: File) => {
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: (res) => {
        const parsed: any[] = (res.data as any[]).map((r) => ({
          recipient: (r.recipient || r.phone || r.number || r.to || "").toString().trim(),
          message: r.message?.toString(),
        })).filter((r) => r.recipient);
        setRows(parsed);
        toast.success(`Loaded ${parsed.length} recipients`);
      },
    });
  };

  const submit = async () => {
    if (!clientId) return toast.error("No client");
    if (rows.length === 0) return toast.error("Upload a CSV first");
    if (!template.trim() && !rows.some((r) => r.message)) return toast.error("Provide a template or per-row message");
    setBusy(true); setProgress(0);
    try {
      const { data: campaign, error: cErr } = await supabase.from("bulk_campaigns").insert({
        client_id: clientId, name: name || "Bulk campaign", message_template: template, total_count: rows.length, status: "processing",
      }).select().single();
      if (cErr) throw cErr;

      const chunk = 200;
      for (let i = 0; i < rows.length; i += chunk) {
        const slice = rows.slice(i, i + chunk);
        const payload = slice.map((r) => {
          const body = (r.message || template).replace(/\{recipient\}/g, r.recipient);
          const isU = /[^\u0000-\u007F]/.test(body);
          return {
            client_id: clientId, recipient: r.recipient, message: body,
            encoding: isU ? "UCS2" : "GSM7", parts_count: Math.max(1, Math.ceil(body.length / (isU ? 70 : 160))),
            status: "queued", priority: 5, external_reference: `campaign:${campaign.id}`,
          };
        });
        const { error } = await supabase.from("messages").insert(payload);
        if (error) throw error;
        setProgress(Math.round(((i + slice.length) / rows.length) * 100));
      }
      await supabase.from("bulk_campaigns").update({ status: "completed", sent_count: rows.length }).eq("id", campaign.id);
      toast.success(`Queued ${rows.length} messages`);
      setRows([]); setTemplate(""); setName(""); setProgress(0);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Bulk SMS</h1><p className="text-sm text-muted-foreground">Send to many recipients from CSV</p></div>

      <Card className="p-5 space-y-4">
        <div className="space-y-1"><Label>Campaign name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="June promo" /></div>
        <div className="space-y-1">
          <Label>Message template <span className="text-muted-foreground font-normal">— use {"{recipient}"} to insert phone</span></Label>
          <Textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4} placeholder="Hi! Your code is 9482. Reply STOP to unsubscribe." />
        </div>
        <div className="space-y-1">
          <Label>CSV file <span className="text-muted-foreground font-normal">— headers: recipient[,message]</span></Label>
          <Input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        {rows.length > 0 && <p className="text-sm">{rows.length} recipients ready</p>}
        {busy && <Progress value={progress} />}
        <Button onClick={submit} disabled={busy || rows.length === 0}><Send className="h-4 w-4 mr-1" />{busy ? "Queueing…" : "Queue campaign"}</Button>
      </Card>

      {rows.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-2">Preview (first 10)</h3>
          <div className="space-y-1 text-sm font-mono">
            {rows.slice(0, 10).map((r, i) => <div key={i} className="border-b border-border/60 py-1">{r.recipient}</div>)}
          </div>
        </Card>
      )}
    </div>
  );
}
