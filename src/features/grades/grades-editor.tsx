import { useState, useTransition } from "react";
import { academicAction } from "@/features/classes/academic-actions";
import { average, parseScore, alphabetical, callNumber } from "@/shared/academic/utils";
import type { Enrollment, Grade } from "@/shared/academic/types";
import { Feedback } from "@/shared/components/feedback";
export function GradesEditor({
  classId,
  term,
  enrollments,
  grades,
  disabled,
  onDirty,
  readOnly = false,
}: {
  classId: string;
  term: number;
  enrollments: Enrollment[];
  grades: Grade[];
  minimum: number;
  disabled: boolean;
  onDirty: (dirty: boolean) => void;
  readOnly?: boolean;
}) {
  const ordered = alphabetical(enrollments);
  function initialScores(id: string) {
    const grade = grades.find((g) => g.student_id === id);
    return {
      activity_score: grade?.activity_score?.toString() ?? "",
      exam_score: grade?.exam_score?.toString() ?? "",
    };
  }
  const [values, setValues] = useState<
    Record<string, { activity_score: string; exam_score: string }>
  >(() =>
    Object.fromEntries(
      enrollments.map((e) => {
        const g = grades.find((g) => g.student_id === e.student_id);
        return [
          e.student_id,
          {
            activity_score: g?.activity_score?.toString() ?? "",
            exam_score: g?.exam_score?.toString() ?? "",
          },
        ];
      }),
    ),
  );
  const [changed, setChanged] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  function edit(
    id: string,
    key: "activity_score" | "exam_score",
    value: string,
  ) {
    setValues((v) => ({
      ...v,
      [id]: { ...initialScores(id), ...v[id], [key]: value },
    }));
    setChanged((v) => Array.from(new Set([...v, id])));
    onDirty(true);
    setMessage("Alterações ainda não salvas.");
  }
  return (
    <section className="panel">
      <div className="page-heading">
        <div>
          <h2>Notas por atividade</h2>
          <p className="muted">
            {term}º bimestre · Média = (1ª Nota + 2ª Nota) / 2
          </p>
        </div>

      </div>
      {!enrollments.length ? (
        <div className="empty">
          Adicione alunos à turma para começar a registrar notas.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (readOnly) return;
            start(async () => {
              setMessage("Salvando…");
              try {
                const result = await academicAction("grades", {
                  class_id: classId,
                  term,
                  rows: changed.map((id) => ({
                    student_id: id,
                    activity_score:
                      parseScore(values[id].activity_score),
                    exam_score:
                      parseScore(values[id].exam_score),
                  })),
                });
                setMessage(result.error || "Notas salvas com sucesso.");
                if (!result.error) {
                  setChanged([]);
                  onDirty(false);
                }
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Erro ao salvar. Suas alterações continuam nesta tela.");
              }
            });
          }}
        >
          <div className="grade-table activity-grades">
            <div className="grade-head">
              <span>Nº</span><span>Aluno</span>
              <span>1ª Nota</span>
              <span>2ª Nota</span>
              <span>Média</span>
            </div>
            {ordered.map((e, index) => {
              const v = values[e.student_id] ?? initialScores(e.student_id);
              let avg: number | null = null;
              let invalid = false;
              try { avg = average(parseScore(v.activity_score), parseScore(v.exam_score)); }
              catch { invalid = true; }
              return (
                <div className="grade-row" key={e.id}>
                  <span className="call-number">{callNumber(index)}</span>
                  <strong className="student-name">
                    {e.students.full_name}
                    {e.status !== "active" && (
                      <small className="muted"> · Matrícula inativa</small>
                    )}
                  </strong>
                  {(["activity_score", "exam_score"] as const).map((key, i) => (
                    <label key={key}>
                      <span className="mobile-label">
                        {i === 0 ? "1ª Nota" : "2ª Nota"}
                      </span>
                      <input
                        aria-label={`${i === 0 ? "1ª Nota" : "2ª Nota"} de ${e.students.full_name}`}
                        type="text"
                        maxLength={8}
                        aria-invalid={invalid}
                        inputMode="decimal"
                        value={v[key]}
                        disabled={readOnly || disabled || pending || e.status !== "active"}
                        onChange={(event) =>
                          edit(e.student_id, key, event.target.value)
                        }
                      />
                    </label>
                  ))}
                  <strong className="grade-average">
                    <span className="mobile-label">Média: </span>
                    {avg === null
                      ? "—"
                      : avg.toLocaleString("pt-BR", {
                          maximumFractionDigits: 4,
                        })}
                  </strong>
                  {invalid && <span className="score-error" role="alert">Use notas de 0 a 10.</span>}
                </div>
              );
            })}
          </div>
          {!readOnly && <div className="save-bar">
            <Feedback
              message={
                message ||
                (!grades.length
                  ? "Nenhuma nota cadastrada neste bimestre."
                  : "Notas carregadas do banco.")
              }
            />
            <button disabled={disabled || pending || !changed.length}>
              {pending ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>}
        </form>
      )}
    </section>
  );
}
