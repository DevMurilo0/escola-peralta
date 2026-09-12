import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db } from "@/shared/supabase/client";
import { useResource, invalidateResources } from "@/shared/hooks/use-resource";
import { QueryState } from "@/shared/components/query-state";
import { Feedback, Modal } from "@/shared/components/feedback";
import { curriculumSchema } from "@/shared/academic/schemas";
import { todayRecife } from "@/shared/academic/utils";
import type { CurriculumRecord } from "@/shared/academic/types";
function CurriculumForm({ record, classId, term, year, onSaved }: {
  record: CurriculumRecord | null; classId: string; term: number; year: number; onSaved: () => void;
}) {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof curriculumSchema>>({
    resolver: zodResolver(curriculumSchema),
    defaultValues: { date: record?.date || (Number(todayRecife().slice(0, 4)) === year ? todayRecife() : `${year}-01-01`), subject: record?.subject || "", content: record?.content || "" },
  });
  return <form className="stack" onSubmit={handleSubmit(async values => {
    if (Number(values.date.slice(0, 4)) !== year) { setMessage(`Use uma data do ano letivo ${year}.`); return; }
    try {
      // Author is supplied by auth.uid() in PostgreSQL, never from a free-form field.
      const result = record
        ? await db().from("curriculum_records").update(values).eq("id", record.id).eq("class_id", classId).select("id").single()
        : await db().from("curriculum_records").insert({ ...values, class_id: classId, term }).select("id").single();
      if (result.error) { setMessage("Erro ao salvar conteúdo. Verifique sua conexão e permissão."); return; }
      invalidateResources(); onSaved();
    } catch { setMessage("Erro ao salvar conteúdo. Tente novamente."); }
  })}>
    <label>Data *<input type="date" min={`${year}-01-01`} max={`${year}-12-31`} required {...register("date")} /></label>
    <label>Componente curricular / disciplina *<input maxLength={150} required placeholder="Matemática" {...register("subject")} /></label>
    <label>Conteúdo trabalhado *<textarea rows={6} maxLength={10000} required {...register("content")} /></label>
    {Object.values(errors).map((error, i) => <p role="alert" key={i}>{error.message}</p>)}
    <Feedback message={message} /><button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar conteúdo"}</button>
  </form>;
}
export default function CurriculumPanel({ classId, term, year, disabled }: { classId: string; term: number; year: number; disabled: boolean }) {
  const loader = useCallback(async () => {
    const { data, error } = await db().from("curriculum_records").select("*").eq("class_id", classId).eq("term", term).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw new Error("Erro ao carregar conteúdos curriculares.");
    return data as CurriculumRecord[];
  }, [classId, term]);
  const resource = useResource(`curriculum:${classId}:${term}`, loader);
  const [editing, setEditing] = useState<CurriculumRecord | null | undefined>();
  const [removing, setRemoving] = useState<CurriculumRecord | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="panel">
    <div className="page-heading"><div><h2>Conteúdos trabalhados</h2><p className="muted">Registro dos conteúdos curriculares trabalhados neste bimestre.</p></div>
      {!disabled && <button onClick={() => setEditing(null)}>+ Registrar conteúdo</button>}
    </div>
    <Feedback message={message} />
    {resource.error || !resource.data ? <QueryState {...resource} /> : resource.data.length ? <div className="curriculum-list">
      {resource.data.map(record => <article key={record.id} className="curriculum-entry">
        <time dateTime={record.date}>{record.date.split("-").reverse().join("/")}</time>
        <div><h3>{record.subject}</h3><p className="curriculum-text">{record.content}</p></div>
        {!disabled && <div className="actions"><button className="secondary" onClick={() => setEditing(record)}>Editar</button><button className="secondary" onClick={() => setRemoving(record)}>Excluir</button></div>}
      </article>)}
    </div> : <p className="empty">Nenhum conteúdo registrado neste bimestre.</p>}
    {editing !== undefined && <Modal title={editing ? "Editar conteúdo" : "Registrar conteúdo"} onClose={() => setEditing(undefined)}>
      <CurriculumForm record={editing} classId={classId} term={term} year={year} onSaved={() => { setEditing(undefined); setMessage("Conteúdo salvo com sucesso."); }} />
    </Modal>}
    {removing && <Modal title="Excluir conteúdo?" onClose={() => { if (!pending) setRemoving(null); }}>
      <p>Excluir o registro de {removing.subject}? Esta ação não pode ser desfeita.</p>
      <button disabled={pending} onClick={async () => {
        setPending(true);
        try {
          const result = await db().from("curriculum_records").delete().eq("id", removing.id).eq("class_id", classId).select("id").single();
          if (result.error) { setMessage("Erro ao excluir conteúdo. Verifique sua permissão."); return; }
          setRemoving(null); setMessage("Conteúdo excluído."); invalidateResources();
        } catch { setMessage("Erro ao excluir conteúdo. Tente novamente."); }
        finally { setPending(false); }
      }}>{pending ? "Excluindo..." : "Confirmar exclusão"}</button>
    </Modal>}
  </section>;
}
