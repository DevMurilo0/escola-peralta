import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProtectedRoute, AdminRoute } from "./guards";
import Loading from "@/components/loading";
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClassPage = lazy(() => import("@/pages/ClassPage"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const Denied = lazy(() => import("@/pages/Denied"));
const NotFound = lazy(() => import("@/pages/NotFound"));
export default function PortalRoutes() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="acesso-negado" element={<Denied />} />
          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="turmas" element={<Dashboard />} />
            <Route path="turmas/:id" element={<ClassPage />} />
            <Route path="calendario" element={<Calendar />} />
            <Route path="perfil" element={<Profile />} />
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
