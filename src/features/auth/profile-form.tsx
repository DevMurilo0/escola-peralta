import { useState, useTransition } from "react";
import { changePassword } from "./profile-actions";
import { Feedback } from "@/components/feedback";
export function ProfileForm() {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="stack narrow"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        if (data.get("password") !== data.get("confirm")) {
          setMessage("As senhas precisam ser iguais.");
          return;
        }
        start(async () => {
          try {
            const r = await changePassword(data.get("password"));
            setMessage(r.error || "Senha atualizada.");
            if (!r.error) form.reset();
          } catch {
            setMessage("Erro ao atualizar a senha. Tente novamente.");
          }
        });
      }}
    >
      <label>
        Nova senha
        <input
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        Confirmar nova senha
        <input
          name="confirm"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </label>
      <p className="small muted">Use pelo menos 12 caracteres.</p>
      <button disabled={pending}>
        {pending ? "Salvando…" : "Definir senha"}
      </button>
      <Feedback message={message} />
    </form>
  );
}
