"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/services/supabase/client";
import type { Session, User, RequiredClaims } from "@supabase/supabase-js";

export type ClaimsType = RequiredClaims & {
  phone?: string;
  email?: string;
  is_profile_complete?: boolean;
  app_metadata?: {
    roles?: ("admin" | "owner" | "tenant")[];
    first_name?: string;
    last_name?: string;
  };
  user_metadata?: {
    avatar_url?: string;
  };
};

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  session: Session | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  signInWithEmailAndPass: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (opts?: { redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  claims: ClaimsType | null;
  isAdmin: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<ClaimsType | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getClaims = async () => {
    const { data } = await supabase.auth.getClaims();
    setClaims((data?.claims as ClaimsType) || null);
  };

  useEffect(() => {
    let ignore = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        getClaims();
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      getClaims();
    });
    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmailAndPass = async (email: string, password: string) => {
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    setSession(data.session);
    setUser(data.session?.user ?? null);
    setLoading(false);
  };

  const signInWithGoogle = async ({
    redirectTo = "/auth/callback?next=/forms",
  }: { redirectTo?: string } = {}) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    setLoading(false);
    if (error) throw error;
    // Supabase will redirect on success
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setLoading(false);
    router.replace("/");
  };

  const isAdmin = claims?.app_metadata?.roles?.includes("admin") || false;
  const needsProfileCompletion = claims?.is_profile_complete === false || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        session,
        loading,
        setLoading,
        signInWithEmailAndPass,
        signInWithGoogle,
        signOut,
        claims,
        isAdmin,
        needsProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
