import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "admin" | "client_user";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  clientId: string | null;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserMeta = async (uid: string) => {
    const [{ data: roleRows }, { data: clientRows }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("clients").select("id").eq("owner_user_id", uid).limit(1),
    ]);
    setRoles((roleRows ?? []).map((r: any) => r.role));
    setClientId(clientRows?.[0]?.id ?? null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadUserMeta(sess.user.id), 0);
      } else {
        setRoles([]);
        setClientId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadUserMeta(sess.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshRoles = async () => { if (user) await loadUserMeta(user.id); };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, clientId, signOut, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const isAdmin = (roles: Role[]) => roles.includes("admin") || roles.includes("super_admin");
