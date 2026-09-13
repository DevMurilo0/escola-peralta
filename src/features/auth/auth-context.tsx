import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { configured, db } from "@/shared/supabase/client";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { masterStatus } from "@/shared/services/master-api";
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "teacher";
  active: boolean;
};
type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isMaster: boolean;
  masterError?: string;
  loading: boolean;
  error?: string;
};
const AuthContext = createContext<(AuthState & { retry: () => void }) | null>(
  null,
);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    isMaster: false,
    loading: configured(),
  });
  const generation = useRef(0);
  const userId = useRef<string | null>(null);
  const masterCache = useRef<{
    token: string;
    value: boolean;
    error?: string;
  } | null>(null);
  const sync = useCallback(async (session: Session | null) => {
    const request = ++generation.current;
    const id = session?.user.id ?? null;
    if (userId.current !== id) {
      invalidateResources();
      userId.current = id;
      masterCache.current = null;
    }
    if (!session) {
      setState({
        session: null,
        profile: null,
        isMaster: false,
        loading: false,
      });
      return;
    }
    setState((old) => ({
      session,
      profile: old.profile?.id === id ? old.profile : null,
      isMaster: old.profile?.id === id ? old.isMaster : false,
      masterError: old.profile?.id === id ? old.masterError : undefined,
      loading: !old.profile || old.profile.id !== id,
    }));
    try {
      const { data, error } = await db()
        .from("profiles")
        .select("id,full_name,email,role,active")
        .eq("id", id)
        .maybeSingle();
      if (request !== generation.current) return;
      const profile = data as Profile | null;
      let isMaster = false;
      let masterError: string | undefined;
      if (profile?.active && profile.role === "admin") {
        if (masterCache.current?.token === session.access_token) {
          isMaster = masterCache.current.value;
          masterError = masterCache.current.error;
        } else {
          const status = await masterStatus(session.access_token);
          isMaster = status.isMaster;
          masterError = status.error;
          masterCache.current = {
            token: session.access_token,
            value: isMaster,
            error: masterError,
          };
        }
      }
      if (request !== generation.current) return;
      setState({
        session,
        profile,
        isMaster,
        masterError,
        loading: false,
        error: error
          ? "Não foi possível verificar sua conta. Tente novamente."
          : undefined,
      });
    } catch {
      if (request === generation.current)
        setState({
          session,
          profile: null,
          isMaster: false,
          loading: false,
          error: "Não foi possível conectar. Verifique sua conexão.",
        });
    }
  }, []);
  const retry = useCallback(() => {
    if (!configured()) return;
    void db()
      .auth.getSession()
      .then(({ data, error }) => {
        if (error)
          setState({
            session: null,
            profile: null,
            isMaster: false,
            loading: false,
            error: "Sua sessão não pôde ser recuperada. Recarregue a página.",
          });
        else void sync(data.session);
      })
      .catch(() =>
        setState({
          session: null,
          profile: null,
          isMaster: false,
          loading: false,
          error: "Não foi possível recuperar sua sessão.",
        }),
      );
  }, [sync]);
  const cancelPending = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    if (!configured()) return;
    let mounted = true;
    // Defer DB calls until the auth callback releases Supabase's session lock.
    const {
      data: { subscription },
    } = db().auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (mounted) void sync(session);
      }, 0);
    });
    retry();
    const focus = () => {
      if (document.visibilityState === "visible") retry();
    };
    document.addEventListener("visibilitychange", focus);
    return () => {
      mounted = false;
      cancelPending();
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", focus);
    };
  }, [retry, sync, cancelPending]);
  return (
    <AuthContext.Provider value={{ ...state, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider ausente.");
  return auth;
}
