import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import Seo from "@/components/Seo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) setReady(true);
    else setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not update password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Seo
        title="Reset password — B-TEXTMAN"
        description="Set a new password for your B-TEXTMAN SMS gateway account."
        path="/reset-password"
      />
      <Card className="w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center"><Radio className="h-5 w-5 text-primary-foreground" /></div>
          <div><h1 className="font-bold text-lg">Set a new password</h1></div>
        </div>
        {ready && (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>New password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
