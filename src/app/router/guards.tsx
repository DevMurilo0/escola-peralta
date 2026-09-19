import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { QueryState } from "@/shared/components/query-state";
import Loading from "@/shared/components/loading";
import { PortalShell } from "@/components/portal-shell";
export function ProtectedRoute() {
  const { loading, session, profile, error, retry } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main className="center-page" id="main">
        <Loading />
      </main>
    );
  if (error)
    return (
      <main className="center-page" id="main">
        <QueryState error={error} retry={retry} />
      </main>
    );
  if (!session)
    return (
      <Navigate
        to="/portal/login?expired=1"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (!profile?.active) return <Navigate to="/portal/acesso-negado" replace />;
  return (
    <PortalShell
      name={profile.full_name}
      admin={profile.role === "admin"}
      avatarPath={profile.avatar_path}
    >
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </PortalShell>
  );
}
export function AdminRoute() {
  const { profile } = useAuth();
  return profile?.active && profile.role === "admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/portal/acesso-negado" replace />
  );
}
