import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { school } from "@/config/school-config";
const links = [
  ["inicio", "Início"],
  ["escola", "A Escola"],
  ["ensino", "Ensino"],
  ["estrutura", "Estrutura"],
  ["projetos", "Projetos"],
  ["contato", "Contato"],
];
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab") {
        const items = [
          toggle.current,
          ...Array.from(
            nav.current?.querySelectorAll<HTMLAnchorElement>("a") || [],
          ),
        ].filter(Boolean) as HTMLElement[];
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const desktop = matchMedia("(min-width: 801px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);
  return (
    <header
      className={`site-nav ${scrolled ? "is-scrolled" : ""} ${open ? "menu-is-open" : ""}`}
    >
      <Link
        className="brand-signature"
        to="/"
        aria-label="Escola Peralta — início"
      >
        {school.logo ? (
          <img
            decoding="async"
            src={school.logo}
            width={160}
            height={64}
            alt="Escola Peralta"
          />
        ) : (
          <>
            <span>ESCOLA</span>
            <strong>Peralta</strong>
          </>
        )}
      </Link>
      <button
        ref={toggle}
        className="site-menu-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="institutional-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="institutional-navigation"
        ref={nav}
        className={open ? "is-open" : ""}
        aria-label="Navegação principal"
      >
        {links.map(([id, label], i) => (
          <a
            href={`#${id}`}
            key={id}
            onClick={() => {
              setOpen(false);
              if (open)
                requestAnimationFrame(() => {
                  const section = document.getElementById(id);
                  section?.focus({ preventScroll: true });
                });
            }}
          >
            <span className="mobile-nav-number" aria-hidden="true">
              0{i + 1}
            </span>
            {label}
          </a>
        ))}
        <Link
          className="site-button nav-portal"
          to="/portal/login"
          onClick={() => setOpen(false)}
        >
          Portal do Professor <ArrowUpRight size={16} />
        </Link>
        <span className="mobile-nav-location">
          Gravatá · Pernambuco
          <br />
          Um lugar para aprender e conviver.
        </span>
      </nav>
    </header>
  );
}
