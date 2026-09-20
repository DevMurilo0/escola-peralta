import { Link, useSearchParams } from "react-router-dom";
import { LoginForm } from "@/features/auth/login-form";
import { configured } from "@/shared/supabase/client";
import { PortalBrand } from "@/components/portal-brand";
import { school } from "@/config/school-config";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function Login() {
  const [params] = useSearchParams();

  return (
    <main id="main" className="login-page">
      <section className="login-intro" aria-label="Escola Peralta">
        <div className="login-intro-media" aria-hidden="true">
          <img src={school.heroImage} alt="" />
        </div>
        <div className="login-intro-overlay" aria-hidden="true" />

        <Link to="/" className="login-brand-link" aria-label="Voltar ao site da Escola Peralta">
          <PortalBrand inverse />
        </Link>

        <div className="login-intro-copy">
          <span className="eyebrow">ESPAÇO DO EDUCADOR</span>
          <h1>Mais tempo para o que importa.</h1>
          <p>
            Turmas, aprendizagem e presença organizadas para acompanhar o dia
            a dia da Escola Peralta.
          </p>
          <div className="login-intro-note">
            <span>Portal interno</span>
            <span>•</span>
            <span>{school.city}</span>
          </div>
        </div>

        <span className="login-intro-caption">
          Um espaço feito para a rotina de quem ensina.
        </span>
      </section>

      <section className="login-panel">
        <div className="login-panel-top">
          <Link to="/" className="login-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Site da escola
          </Link>
        </div>

        <div className="login-card">
          <div className="login-card-brand">
            <PortalBrand compact />
          </div>
          <span className="eyebrow">ACESSO AO PORTAL</span>
          <h2>Bom ter você aqui.</h2>
          <p className="muted">
            Entre com seu e-mail e senha para acessar suas turmas e registros.
          </p>

          {!configured() && (
            <p className="feedback">
              Configure as variáveis públicas do Supabase para habilitar o
              acesso. Consulte o README.
            </p>
          )}
          {params.has("expired") && (
            <p role="status" className="login-status">
              Sua sessão expirou. Entre novamente para continuar.
            </p>
          )}
          {params.has("invalid_link") && (
            <p role="alert" className="login-status">
              Link inválido ou expirado. Solicite um novo link à administração.
            </p>
          )}

          <LoginForm enabled={configured()} />

          <div className="login-security-note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Acesso restrito à equipe da Escola Peralta.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
