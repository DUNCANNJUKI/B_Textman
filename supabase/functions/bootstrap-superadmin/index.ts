// One-shot bootstrap: creates the configured super admin if missing.
// Safe to call repeatedly — it's a no-op once the user exists with the role.
import { corsHeaders, json, errorRes, adminClient } from "../_shared/utils.ts";

const TARGET_EMAIL = "duncannjuki@gmail.com";
const TARGET_PASSWORD = "Duncan@324";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = adminClient();

  // Find or create user
  let userId: string | null = null;
  const { data: list, error: listErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) return errorRes(listErr.message, 500);
  const existing = list.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL);
  if (existing) {
    userId = existing.id;
    // Reset password to known value so the user can sign in
    await sb.auth.admin.updateUserById(userId, { password: TARGET_PASSWORD, email_confirm: true });
  } else {
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Duncan", company: "B TEXTMAN HQ" },
    });
    if (cErr) return errorRes(cErr.message, 500);
    userId = created.user.id;
  }

  // Ensure profile + client rows exist (trigger handles new users, but be safe)
  await sb.from("profiles").upsert({ user_id: userId, display_name: "Duncan" }, { onConflict: "user_id" });
  const { data: existingClient } = await sb.from("clients").select("id").eq("owner_user_id", userId).maybeSingle();
  if (!existingClient) {
    await sb.from("clients").insert({ owner_user_id: userId, name: "B TEXTMAN HQ" });
  }

  // Ensure super_admin role
  const { data: role } = await sb.from("user_roles").select("id").eq("user_id", userId).eq("role", "super_admin").maybeSingle();
  if (!role) await sb.from("user_roles").insert({ user_id: userId, role: "super_admin" });

  return json({ ok: true, user_id: userId, email: TARGET_EMAIL });
});
