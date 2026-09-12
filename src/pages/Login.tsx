import { Link } from "react-router-dom";
import { LoginForm } from "@/features/auth/login-form";
import { configured } from "@/lib/supabase/client";
import { useSearchParams } from "react-router-dom";
export default function Login() {
  const [params] = useSearchParams();
  return (
    <main id="main" className="login-page">
      <div className="login-intro">
        <Link to="/" className="portal-brand portal-brand-inverse">
          <strong>Escola Peralta</strong>
          <small>Portal do Professor</small>
        </Link>
        <div>
          <span className="eyebrow">ESPAÇO DO EDUCADOR</span>
          <h1>
            Mais tempo para
            <br />o que importa.
          </h1>
          <p>
            Turmas, aprendizagem e presença.
            <br />
            Seu dia na escola, organizado em um só lugar.
          </p>
        </div>
        <span>Gravatá · Pernambuco</span>
      </div>
      <section className="login-card">
        <span className="eyebrow">PORTAL PERALTA</span>
        <h2>Bom ter você aqui.</h2>
        <p className="muted">Entre para acompanhar suas turmas.</p>
        {!configured() && (
          <p className="feedback">
            Configure as variáveis públicas do Supabase para habilitar o acesso.
            Consulte o README.
          </p>
        )}
        {params.has("expired") && (
          <p role="status">Entre para iniciar ou renovar sua sessão.</p>
        )}
        {params.has("invalid_link") && (
          <p role="alert">
            Link inválido ou expirado. Solicite um novo link à administração.
          </p>
        )}
        <LoginForm enabled={configured()} />
        <Link to="/">← Voltar ao site da escola</Link>
      </section>
    </main>
  );
}
