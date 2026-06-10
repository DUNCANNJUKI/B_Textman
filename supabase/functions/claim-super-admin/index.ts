// Lets the FIRST authenticated user claim super_admin if none exists yet.
// After a super_admin is in place this function returns 403.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, errorRes, adminClient } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return errorRes("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return errorRes("Unauthorized", 401);
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } });
  const { data: u, error: uErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (uErr || !u?.claims?.sub) return errorRes("Unauthorized", 401);
  const userId = u.claims.sub as string;

  const sb = adminClient();
  const { count } = await sb.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
  if ((count ?? 0) > 0) return errorRes("A super admin already exists", 403);

  await sb.from("user_roles").insert({ user_id: userId, role: "super_admin" });
  return json({ ok: true });
});
