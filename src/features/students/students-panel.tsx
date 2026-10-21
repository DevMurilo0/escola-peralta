import { useState, useTransition } from "react";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema } from "@/shared/academic/schemas";
import { academicAction } from "@/features/classes/academic-actions";
import { age, todayRecife, alphabetical, callNumber } from "@/shared/academic/utils";
import { Modal, Feedback } from "@/shared/components/feedback";
import type { Enrollment, Student } from "@/shared/academic/types";
export function StudentForm({
  student,
  classId,
  onSaved,
}: {
  student: Student | null;
  classId: string;
  onSaved: () => void;
}) {
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ full_name: string; birth_date: string }>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: student?.full_name || "",
      birth_date: student?.birth_date || "",
    },
  });
  return (
    <form
      className="stack"
      onSubmit={handleSubmit(async (values) => {
        try {
          const result = await academicAction("student", {
            ...values,
            class_id: classId,
            student_id: student?.id || null,
          });
          if (result.error) setMessage(result.error);
          else onSaved();
        } catch {
          setMessage("Não foi possível conectar. Tente novamente.");
        }
      })}
    >
      <label>
        Nome completo *
        <input {...register("full_name")} autoComplete="off" maxLength={150} />
      </label>
      {errors.full_name && <p role="alert">{errors.full_name.message}</p>}
      <label>
        Data de nascimento *
        <input type="date" max={todayRecife()} {...register("birth_date")} />
      </label>
      {errors.birth_date && <p role="alert">{errors.birth_date.message}</p>}
      <Feedback message={message} />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar aluno"}
      </button>
    </form>
  );
}
export function StudentsPanel({
  classId,
  enrollments,
  canManage,
  hideAdd = false,
  onAcademicView,
}: {
  classId: string;
  enrollments: Enrollment[];
  canManage: boolean;
  hideAdd?: boolean;
  onAcademicView?: (enrollment: Enrollment) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const rows = alphabetical(enrollments.filter(e => showInactive || e.status === "active"));
  const [editing, setEditing] = useState<Student | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Enrollment | null>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return (
    <section className="panel">
      <div className="page-heading">
        <div>
          <h2>Alunos</h2>
          <p className="muted">Matrículas e informações essenciais da turma.</p>
        </div>
        {canManage && !hideAdd && (
          <button onClick={() => setEditing(null)}>+ Adicionar aluno</button>
        )}
      </div>
      <Feedback message={message} />
      {enrollments.some(e => e.status !== "active") && <label className="inline-check"><input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> Mostrar matrículas inativas</label>}
      {!rows.length ? (
        <div className="empty">
          Nenhum aluno cadastrado.
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nº</th><th>Nome</th>
                <th>Nascimento</th>
                <th>Idade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, index) => (
                <tr key={e.id}>
                  <td className="call-number">{callNumber(index)}</td><td>{e.students.full_name}</td>
                  <td>
                    {e.students.birth_date.split("-").reverse().join("/")}
                  </td>
                  <td>{age(e.students.birth_date)} anos</td>
                  <td>{e.status === "active" ? "Ativo" : "Inativo"}</td>
                  <td>
                    <div className="actions">
                      {onAcademicView && (
                        <button
                          className="secondary"
                          onClick={() => onAcademicView(e)}
                        >
                          Notas e frequência
                        </button>
                      )}
                    {canManage && (
                      <>
                        <button
                          className="secondary"
                          onClick={() => setEditing(e.students)}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary"
                          onClick={() => setRemoving(e)}
                        >
                          {e.status === "active"
                            ? "Remover da turma"
                            : "Reativar matrícula"}
                        </button>
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Editar aluno" : "Adicionar aluno"}
          onClose={() => setEditing(undefined)}
        >
          <StudentForm
            student={editing}
            classId={classId}
            onSaved={() => {
              setEditing(undefined);
              setMessage("Aluno salvo.");
              invalidateResources();
            }}
          />
        </Modal>
      )}
      {removing && (
        <Modal
          title={
            removing.status === "active"
              ? "Remover aluno da turma?"
              : "Reativar matrícula?"
          }
          onClose={() => setRemoving(null)}
        >
          <p>
            {removing.students.full_name}. O histórico de notas e frequência
            será preservado.
          </p>
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  const result = await academicAction("enrollment", {
                    class_id: classId,
                    student_id: removing.student_id,
                    status:
                      removing.status === "active" ? "inactive" : "active",
                  });
                  setMessage(result.error || "Matrícula atualizada.");
                  setRemoving(null);
                  invalidateResources();
                } catch {
                  setMessage("Erro de conexão. Tente novamente.");
                  setRemoving(null);
                }
              })
            }
          >
            {pending ? "Salvando…" : "Confirmar"}
          </button>
        </Modal>
      )}
    </section>
  );
}
