import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/shared/supabase/client";
// Confirmation by an explicit click prevents email/security link scanners consuming a one-time token.
export default function Confirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const token = params.get("token_hash");
  const type = params.get("type");
  return (
    <main id="main" className="center-page">
      <h1>Seu acesso ao Portal Peralta</h1>
      <p>Confirme o acesso e defina sua senha na próxima tela.</p>
      <button
        disabled={pending}
        onClick={async () => {
          if (!token || (type !== "invite" && type !== "recovery")) {
            setError("Link inválido. Solicite um novo link à administração.");
            return;
          }
          setPending(true);
          try {
            const { error } = await db().auth.verifyOtp({
              token_hash: token,
              type,
            });
            if (error)
              setError(
                "Link inválido ou expirado. Solicite um novo link à administração.",
              );
            else navigate("/portal/perfil", { replace: true });
          } catch {
            setError("Não foi possível conectar. Tente novamente.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Confirmando…" : "Confirmar meu acesso"}
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
