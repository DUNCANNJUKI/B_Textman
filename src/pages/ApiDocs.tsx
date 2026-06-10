import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const base = `${import.meta.env.VITE_SUPABASE_URL ?? "https://YOUR-PROJECT.supabase.co"}/functions/v1`;

const samples = {
  curl: `curl -X POST ${base}/send-sms \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient":"+254700000000","message":"Hello from B TEXTMAN"}'`,
  js: `await fetch("${base}/send-sms", {
  method: "POST",
  headers: { "Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json" },
  body: JSON.stringify({ recipient: "+254700000000", message: "Hello" })
});`,
  python: `import requests
r = requests.post("${base}/send-sms",
  headers={"Authorization": "Bearer YOUR_API_KEY"},
  json={"recipient": "+254700000000", "message": "Hello"})
print(r.json())`,
  php: `<?php
$ch = curl_init("${base}/send-sms");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer YOUR_API_KEY", "Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["recipient"=>"+254700000000","message"=>"Hello"]));
echo curl_exec($ch);`,
};

const endpoints = [
  { m: "POST", p: "/send-sms", d: "Queue a single SMS. Body: { recipient, message, priority?, external_reference? }" },
  { m: "POST", p: "/bulk-send", d: "Queue many SMS. Body: { messages: [{ recipient, message }] }" },
  { m: "GET",  p: "/message-status?id=<uuid>", d: "Fetch the status of a message." },
  { m: "POST", p: "/device-register", d: "Register an Android device. Body: { device_name, phone_number, sim_operator, android_version }" },
  { m: "POST", p: "/device-heartbeat", d: "Heartbeat from a device. Auth header: Bearer <device_token>. Body: { battery_level, signal_strength, internet_type, ip_address }" },
  { m: "POST", p: "/device-status-update", d: "Device reports SMS result. Body: { message_id, status, error_message? }" },
  { m: "GET",  p: "/account-stats", d: "Aggregated account metrics." },
];

export default function ApiDocs() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold tracking-tight">API Documentation</h1><p className="text-sm text-muted-foreground">REST endpoints for sending SMS and managing devices</p></div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Authentication</h3>
        <p className="text-sm text-muted-foreground mb-2">Send your API key in the <code className="text-xs">Authorization</code> header as a Bearer token. Device endpoints use the device token instead.</p>
        <pre className="text-xs bg-muted p-3 rounded">Authorization: Bearer btx_xxxxxxxxxxxxxxxxxxxxxxxx</pre>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Endpoints</h3>
        <div className="space-y-2">
          {endpoints.map((e) => (
            <div key={e.p} className="border border-border rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${e.m === "POST" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>{e.m}</span>
                <code className="text-xs">{e.p}</code>
              </div>
              <p className="text-xs text-muted-foreground">{e.d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Code samples — send SMS</h3>
        <Tabs defaultValue="curl">
          <TabsList><TabsTrigger value="curl">cURL</TabsTrigger><TabsTrigger value="js">JavaScript</TabsTrigger><TabsTrigger value="python">Python</TabsTrigger><TabsTrigger value="php">PHP</TabsTrigger></TabsList>
          {Object.entries(samples).map(([k, v]) => (
            <TabsContent key={k} value={k}><pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre">{v}</pre></TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
