import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { SchoolClass } from "@/shared/academic/types";
import { db } from "@/shared/supabase/client";
import { useResource } from "@/shared/hooks/use-resource";
import { Feedback, Modal } from "@/shared/components/feedback";
import { QueryState } from "@/shared/components/query-state";
import { StudentAcademic } from "./student-academic";
import { studentAdminAction } from "./student-actions";
import type {
  AdminEnrollment,
  AdminStudent,
  StudentAttendance,
  StudentDetailsData,
  StudentGrade,
} from "./types";

async function fetchStudentDetails(studentId: string): Promise<StudentDetailsData> {
  const client = db();
  const [enrollments, grades, attendance] = await Promise.all([
    client
      .from("enrollments")
      .select("id,student_id,class_id,school_year,status,enrolled_at,classes(id,name,school_year,active)")
      .eq("student_id", studentId)
      .order("school_year", { ascending: false })
      .order("enrolled_at", { ascending: false }),
    client
      .from("grades")
      .select("class_id,term,activity_score,exam_score,average")
      .eq("student_id", studentId),
    client
      .from("attendance_records")
      .select("status,attendance_sessions!inner(id,class_id,date,term)")
      .eq("student_id", studentId),
  ]);
  if (enrollments.error || grades.error || attendance.error)
    throw new Error("Não foi possível carregar o histórico do aluno.");
  return {
    enrollments: (enrollments.data ?? []) as unknown as AdminEnrollment[],
    grades: (grades.data ?? []) as StudentGrade[],
    attendance: (attendance.data ?? []) as unknown as StudentAttendance[],
  };
}

function date(value: string) {
  return value.split("-").reverse().join("/");
}

export function StudentDetails({
  student,
  classes,
  schoolYear,
  teachersByClass,
  backLabel,
  onBack,
  onArchived,
}: {
  student: AdminStudent;
  classes: SchoolClass[];
  schoolYear: number;
  teachersByClass: Record<string, string[]>;
  backLabel: string;
  onBack: () => void;
  onArchived: (name: string) => void;
}) {
  const loader = useCallback(
    () => fetchStudentDetails(student.id),
    [student.id],
  );
  const resource = useResource(`admin:student:${student.id}`, loader);
  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const enrollments = useMemo(
    () => resource.data?.enrollments ?? [],
    [resource.data?.enrollments],
  );
  const activeThisYear = enrollments.filter(
    (item) => item.status === "active" && item.school_year === schoolYear,
  );
  const current = activeThisYear.length === 1 ? activeThisYear[0] : null;
  const currentLabel =
    activeThisYear.length > 1
      ? "Matrículas ativas inconsistentes"
      : current?.classes?.name || "Sem turma atual";
  const currentTeacherNames = Array.from(
    new Set(
      activeThisYear.flatMap(
        (item) => teachersByClass[item.class_id] ?? [],
      ),
    ),
  );
  const currentTeachersLabel =
    currentTeacherNames.join(", ") || "Nenhum professor vinculado";
  const academicEnrollment = enrollments.find(
    (item) => item.id === selectedEnrollment,
  );
  const target = classes.find((item) => item.id === targetClass);
  const activeClassIds = new Set(activeThisYear.map((item) => item.class_id));
  const transferOptions = classes.filter(
    (item) => item.active && !activeClassIds.has(item.id),
  );

  useEffect(() => {
    if (!enrollments.length) return;
    if (!enrollments.some((item) => item.id === selectedEnrollment))
      setSelectedEnrollment(current?.id || enrollments[0].id);
  }, [current?.id, enrollments, selectedEnrollment]);

  function run(
    kind: "update" | "transfer" | "archive",
    values: unknown,
  ) {
    startTransition(async () => {
      setMessage("Salvando…");
      const result = await studentAdminAction(kind, values);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (kind === "archive") {
        onArchived(student.full_name);
        return;
      }
      if (kind === "transfer") {
        setConfirmTransfer(false);
        setTargetClass("");
        setMessage(`${student.full_name} foi transferido para ${target?.name}.`);
      } else {
        setEditing(false);
        setMessage("Informações do aluno atualizadas.");
      }
    });
  }

  if (!resource.data || resource.error) return <QueryState {...resource} />;

  return (
    <section className="admin-student-details page-enter">
      <button className="back-button" onClick={onBack}>
        ← {backLabel}
      </button>
      <div className="page-heading student-detail-heading">
        <div>
          <span className="eyebrow">ALUNO</span>
          <h2>{student.full_name}</h2>
          <p>
            Nascimento: {date(student.birth_date)} · Turma atual: {currentLabel}
            {current && ` · Ano letivo: ${current.school_year}`}
          </p>
          <p className="student-detail-teachers">
            Professor(es): {currentTeachersLabel}
          </p>
        </div>
        <button className="secondary" onClick={() => setEditing(true)}>
          Editar informações
        </button>
      </div>
      <Feedback message={message} />

      <section className="panel">
        <div className="page-heading">
          <div>
            <h3>Histórico acadêmico</h3>
            <p className="muted small">
              Selecione a turma para consultar notas e frequência sem misturar
              registros de matrículas diferentes.
            </p>
          </div>
          {enrollments.length > 0 && (
            <label className="history-selector">
              Matrícula / turma
              <select
                value={selectedEnrollment}
                onChange={(event) => setSelectedEnrollment(event.target.value)}
              >
                {enrollments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.school_year} · {item.classes?.name || "Turma indisponível"}
                    {item.status === "inactive" ? " · Histórica" : " · Atual"}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {!academicEnrollment ? (
          <p className="empty">Este aluno ainda não possui matrícula.</p>
        ) : (
          <StudentAcademic
            key={academicEnrollment.id}
            classId={academicEnrollment.class_id}
            grades={resource.data.grades}
            attendance={resource.data.attendance}
          />
        )}
      </section>

      <section className="panel enrollment-management">
        <h3>Gerenciamento da matrícula</h3>
        <p>Turma atual: <strong>{currentLabel}</strong></p>
        <div className="inline-form">
          <label>
            Nova turma
            <select
              value={targetClass}
              onChange={(event) => setTargetClass(event.target.value)}
            >
              <option value="">Selecionar turma</option>
              {transferOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.school_year}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!targetClass || pending}
            onClick={() => setConfirmTransfer(true)}
          >
            Mudar de turma
          </button>
        </div>
      </section>

      <section className="danger-zone">
        <span className="eyebrow">ZONA DE PERIGO</span>
        <h3>Remover cadastro do aluno</h3>
        <p>
          O aluno será desativado, mas notas, frequência e matrículas históricas
          serão preservadas.
        </p>
        <button className="danger-button" onClick={() => setConfirmArchive(true)}>
          Remover aluno
        </button>
      </section>

      {editing && (
        <Modal title="Editar informações" onClose={() => !pending && setEditing(false)}>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              run("update", {
                student_id: student.id,
                full_name: form.get("name"),
                birth_date: form.get("birth_date"),
              });
            }}
          >
            <label>
              Nome completo
              <input
                name="name"
                defaultValue={student.full_name}
                minLength={3}
                maxLength={150}
                required
              />
            </label>
            <label>
              Data de nascimento
              <input
                type="date"
                name="birth_date"
                defaultValue={student.birth_date}
                max={new Intl.DateTimeFormat("en-CA", {
                  timeZone: "America/Recife",
                }).format(new Date())}
                required
              />
            </label>
            <Feedback message={message} />
            <button disabled={pending}>Salvar alterações</button>
          </form>
        </Modal>
      )}

      {confirmTransfer && target && (
        <Modal title={`Mudar ${student.full_name} de ${currentLabel} para ${target.name}?`} onClose={() => !pending && setConfirmTransfer(false)}>
          <p>Notas, frequência e histórico da turma anterior serão preservados.</p>
          <div className="actions">
            <button className="secondary" onClick={() => setConfirmTransfer(false)}>
              Cancelar
            </button>
            <button
              disabled={pending}
              onClick={() =>
                run("transfer", {
                  student_id: student.id,
                  target_class_id: target.id,
                })
              }
            >
              Confirmar mudança
            </button>
          </div>
        </Modal>
      )}

      {confirmArchive && (
        <Modal title={`Remover cadastro de ${student.full_name}?`} onClose={() => !pending && setConfirmArchive(false)}>
          <p>
            O aluno deixará de aparecer como aluno ativo. O histórico acadêmico
            existente será preservado.
          </p>
          <div className="actions">
            <button className="secondary" onClick={() => setConfirmArchive(false)}>
              Cancelar
            </button>
            <button
              className="danger-button"
              disabled={pending}
              onClick={() => run("archive", { student_id: student.id })}
            >
              Remover aluno
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
