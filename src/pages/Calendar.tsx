import { Link } from "react-router-dom";
import { useResource } from "@/shared/hooks/use-resource";
import { QueryState } from "@/shared/components/query-state";
import { db } from "@/shared/supabase/client";
import { useAuth } from "@/features/auth/auth-context";
async function loadCalendar() {
  const client = db();
  const { data, error } = await client
    .from("attendance_sessions")
    .select("id,date,term,class_id,classes(name)")
    .order("date", { ascending: false })
    .limit(100);
  if (error) throw new Error("Falha ao carregar chamadas.");
  return data;
}
export default function Calendar() {
  const { profile } = useAuth();
  const resource = useResource(`calendar:${profile!.id}`, loadCalendar);
  if (!resource.data || resource.error) return <QueryState {...resource} />;
  const data = resource.data;
  return (
    <>
      <span className="eyebrow">ACOMPANHAMENTO</span>
      <h1>Calendário de chamadas</h1>
      <p className="muted">
        Últimas 100 chamadas registradas. Abra a frequência de uma turma para
        consultar seu calendário completo.
      </p>
      <section className="panel">
        {data.length ? (
          data.map((s) => (
            <Link
              className="list-row"
              key={s.id}
              to={`/portal/turmas/${s.class_id}?term=${s.term}&module=attendance`}
            >
              <strong>
                {(s.classes as unknown as { name: string })?.name}
              </strong>
              <span>
                {s.date.split("-").reverse().join("/")} · {s.term}º bimestre →
              </span>
            </Link>
          ))
        ) : (
          <div className="empty">
            Nenhuma chamada realizada. Acesse uma turma para registrar a
            primeira.
          </div>
        )}
      </section>
    </>
  );
}
