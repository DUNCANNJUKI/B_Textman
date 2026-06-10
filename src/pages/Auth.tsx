import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Radio, Loader2 } from "lucide-react";
import Seo from "@/components/Seo";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passSchema = z.string().min(8, "Min 8 characters").max(72);

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const e1 = emailSchema.safeParse(email);
      if (!e1.success) return toast.error(e1.error.issues[0].message);

      if (forgot) {
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent");
        setForgot(false);
        return;
      }

      const p1 = passSchema.safeParse(password);
      if (!p1.success) return toast.error(p1.error.issues[0].message);

      setLoading(true);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { company },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err ?? "Authentication failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <Seo
        title="Sign in to B-TEXTMAN — SMS Gateway Console"
        description="Sign in or create a B-TEXTMAN account to manage your Android SMS gateway devices, API keys, and message traffic."
        path="/auth"
      />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
      <Card className="w-full max-w-md p-8 relative z-10 shadow-card border-border/60">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Radio className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Sign in to B-TEXTMAN</h1>
            <div className="text-xs text-muted-foreground">SMS Gateway Control Center</div>
          </div>
        </div>

        {forgot ? (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-xl font-semibold">Reset your password</h2>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send reset link
            </Button>
            <button type="button" className="text-sm text-muted-foreground hover:text-foreground w-full text-center" onClick={() => setForgot(false)}>
              Back to sign in
            </button>
          </form>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup") }>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={submit} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign in
                </Button>
                <button type="button" className="text-sm text-primary hover:underline w-full text-center" onClick={() => setForgot(true)}>
                  Forgot password?
                </button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={submit} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Company / Account name</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 8 characters" /></div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </p>
      </Card>
    </div>
  );
}
