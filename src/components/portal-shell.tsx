import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  House,
  BookOpen,
  CalendarDays,
  User,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { logout } from "@/features/auth/actions";
export function PortalShell({
  name,
  admin,
  children,
}: {
  name: string;
  admin: boolean;
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
        <span className="portal-brand portal-brand-compact">
          <strong>Escola Peralta</strong>
          <small>Portal do Professor</small>
        </span>
        <button
          aria-label="Abrir navegação"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu size={20} />
        </button>
      </header>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/portal" className="portal-brand">
          <strong>Escola Peralta</strong>
          <small>Portal do Professor</small>
        </Link>
        <span className="eyebrow">SALA DOS PROFESSORES</span>
        <nav aria-label="Portal">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              onClick={() => setOpen(false)}
              className={
                path === href ||
                (href === "/portal/turmas" && path.startsWith("/portal/turmas/"))
                  ? "selected"
                  : ""
              }
              to={href}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">{name.slice(0, 1)}</div>
          <strong>{name}</strong>
          <small>{admin ? "Administração" : "Professor(a)"}</small>
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
            <button className="secondary" disabled={pending}>
              <LogOut size={17} />
              Sair da conta
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          <Link to="/">Site da escola ↗</Link>
        </div>
      </aside>
      <main id="main" className="portal-main">
        {children}
      </main>
    </div>
  );
}
