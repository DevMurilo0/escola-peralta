import { Component, lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Loading from "@/shared/components/loading";
const Home = lazy(() => import("@/pages/Home"));
const PortalRoutes = lazy(() => import("@/app/router/PortalRoutes"));
const Confirm = lazy(() => import("@/pages/Confirm"));
const NotFound = lazy(() => import("@/pages/NotFound"));
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main id="main" className="center-page">
        <h1>Não foi possível abrir esta página</h1>
        <p>Verifique sua conexão e tente novamente.</p>
        <button onClick={() => window.location.reload()}>
          Recarregar página
        </button>
        <a href="/">Voltar ao site</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isPublic = pathname === "/";
    document.title = isPublic
      ? "Escola Peralta | Um mundo de descobertas em Gravatá"
      : "Portal Peralta | Escola Peralta";
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        "content",
        isPublic ? "index, follow" : "noindex, nofollow",
      );
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portal/*" element={<PortalRoutes />} />
          <Route path="/auth/confirm" element={<Confirm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
