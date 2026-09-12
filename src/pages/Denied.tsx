import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { logout } from "@/features/auth/actions";
export default function Denied() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  return (
    <main id="main" className="center-page">
      <h1>Acesso não autorizado</h1>
      <p>
        Sua conta está inativa ou não possui a permissão necessária. Procure a
        administração.
      </p>
      <Link to="/portal">Voltar ao portal</Link>
      <button
        onClick={async () => {
          try {
            await logout();
            navigate("/portal/login", { replace: true });
          } catch {
            setError("Não foi possível sair. Tente novamente.");
          }
        }}
      >
        Sair
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
