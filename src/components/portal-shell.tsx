import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  House,
  BookOpen,
  CalendarDays,
  User,
  Settings,
  LogOut,
  Menu,
  ExternalLink,
} from "lucide-react";
import { logout } from "@/features/auth/actions";
import { ProfileAvatar } from "@/features/auth/profile-avatar";
import { PortalBrand } from "@/components/portal-brand";

export function PortalShell({
  name,
  admin,
  avatarPath,
  children,
}: {
  name: string;
  admin: boolean;
  avatarPath?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const links = [
    ["/portal", "Início", House],
    ["/portal/turmas", "Minhas turmas", BookOpen],
    ["/portal/calendario", "Calendário", CalendarDays],
    ["/portal/perfil", "Perfil", User],
    ...(admin ? [["/portal/admin", "Administração", Settings] as const] : []),
  ] as const;

  return (
    <div className="portal">
      <header className="mobile-bar">
        <Link to="/portal" aria-label="Ir para o início do portal">
          <PortalBrand compact />
        </Link>
        <button
          className="mobile-menu-button"
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu size={20} />
        </button>
      </header>

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/portal" className="sidebar-brand-link">
          <PortalBrand />
        </Link>

        <div className="sidebar-nav-heading">
          <span className="eyebrow">SALA DOS PROFESSORES</span>
          <small>Rotina escolar em um só lugar</small>
        </div>

        <nav aria-label="Portal">
          {links.map(([href, label, Icon]) => {
            const selected =
              path === href ||
              (href === "/portal/turmas" && path.startsWith("/portal/turmas/"));

            return (
              <Link
                key={href}
                onClick={() => setOpen(false)}
                className={selected ? "selected" : ""}
                to={href}
              >
                <span className="sidebar-nav-icon">
                  <Icon size={18} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <ProfileAvatar name={name} path={avatarPath} />
            <div>
              <strong>{name}</strong>
              <small>{admin ? "Direção / Administração" : "Professor(a)"}</small>
            </div>
          </div>

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              try {
                await logout();
                navigate("/portal/login", { replace: true });
              } catch {
                setError("Não foi possível sair. Tente novamente.");
              } finally {
                setPending(false);
              }
            }}
          >
            <button className="secondary sidebar-logout" disabled={pending}>
              <LogOut size={16} />
              {pending ? "Saindo…" : "Sair da conta"}
            </button>
          </form>

          {error && <p role="alert">{error}</p>}

          <Link to="/" className="sidebar-site-link">
            Site da escola
            <ExternalLink size={13} aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {open && (
        <button
          className="portal-menu-backdrop"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}

      <main id="main" className="portal-main">
        {children}
      </main>
    </div>
  );
}
