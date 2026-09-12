import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { classSchema } from "@/shared/academic/schemas";
import { todayRecife } from "@/shared/academic/utils";
import type { SchoolClass } from "@/shared/academic/types";
import { Modal, Feedback } from "@/shared/components/feedback";
import { saveClass } from "./class-actions";
export function ClassForm({ schoolClass, onClose, onSaved }: {
  schoolClass?: SchoolClass; onClose: () => void; onSaved: (id: string) => void;
}) {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: schoolClass?.name || "", grade_level: schoolClass?.grade_level || "",
      shift: schoolClass?.shift as "Manhã" | "Tarde" | "Integral" || "Manhã",
      school_year: schoolClass?.school_year || Number(todayRecife().slice(0, 4)),
    },
  });
  return <Modal title={schoolClass ? "Editar turma" : "Nova turma"} onClose={() => { if (!isSubmitting) onClose(); }}>
    <form className="stack" onSubmit={handleSubmit(async values => {
      try { onSaved(await saveClass(values, schoolClass?.id, schoolClass?.active)); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Erro ao salvar turma."); }
    })}>
      <label>Nome da turma *<input {...register("name")} placeholder="3º Ano A" maxLength={100} required /></label>
      <label>Série/Ano *<input {...register("grade_level")} placeholder="3º Ano" maxLength={100} required /></label>
      <label>Turno *<select {...register("shift")}><option>Manhã</option><option>Tarde</option><option>Integral</option></select></label>
      <label>Ano letivo *<input {...register("school_year", { valueAsNumber: true })} type="number" min={2000} max={2200} required /></label>
      {Object.values(errors).map((error, i) => <p role="alert" key={i}>{error.message}</p>)}
      <Feedback message={message} />
      <button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : schoolClass ? "Salvar turma" : "Criar turma"}</button>
    </form>
  </Modal>;
}
export function ArchiveClass({ schoolClass, onClose, onSaved }: {
  schoolClass: SchoolClass; onClose: () => void; onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <Modal title="Arquivar turma?" onClose={() => { if (!pending) onClose(); }}>
    <p>{schoolClass.name} ficará disponível para consulta. Alunos, notas, frequência e conteúdos serão preservados.</p>
    <Feedback message={message} />
    <button disabled={pending} onClick={async () => {
      setPending(true);
      try {
        const { name, grade_level, shift, school_year } = schoolClass;
        await saveClass({ name, grade_level, shift, school_year }, schoolClass.id, false);
        onSaved();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Erro ao arquivar turma."); }
      finally { setPending(false); }
    }}>{pending ? "Arquivando..." : "Confirmar arquivamento"}</button>
  </Modal>;
}
