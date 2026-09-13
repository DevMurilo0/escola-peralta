import { useState } from "react";
import type {
  StudentAttendance,
  StudentGrade,
} from "./types";

const terms = [1, 2, 3, 4] as const;
const statusLabel = {
  present: "Presente",
  absent: "Falta",
  justified: "Falta justificada",
};

function score(value: number | null) {
  return value === null
    ? "—"
    : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function StudentAcademic({
  classId,
  grades,
  attendance,
}: {
  classId: string;
  grades: StudentGrade[];
  attendance: StudentAttendance[];
}) {
  const [term, setTerm] = useState<(typeof terms)[number]>(1);
  const grade = grades.find(
    (item) => item.class_id === classId && item.term === term,
  );
  const records = attendance
    .filter(
      (item) =>
        item.attendance_sessions.class_id === classId &&
        item.attendance_sessions.term === term,
    )
    .sort((a, b) =>
      a.attendance_sessions.date.localeCompare(b.attendance_sessions.date),
    );
  const present = records.filter((item) => item.status === "present").length;
  const absent = records.filter((item) => item.status === "absent").length;
  const justified = records.filter(
    (item) => item.status === "justified",
  ).length;
  const frequency = records.length ? (present / records.length) * 100 : null;

  return (
    <section className="student-academic">
      <div className="term-tabs" aria-label="Bimestres">
        {terms.map((value) => (
          <button
            className="secondary"
            key={value}
            aria-pressed={term === value}
            onClick={() => setTerm(value)}
          >
            {value}º Bimestre
          </button>
        ))}
      </div>
      <div className="student-academic-grid">
        <section className="panel inset-panel">
          <h3>Notas</h3>
          {!grade ? (
            <p className="empty">Sem notas registradas neste bimestre.</p>
          ) : (
            <dl className="student-summary-list">
              <div>
                <dt>1ª Nota</dt>
                <dd>{score(grade.activity_score)}</dd>
              </div>
              <div>
                <dt>2ª Nota</dt>
                <dd>{score(grade.exam_score)}</dd>
              </div>
              <div>
                <dt>Média</dt>
                <dd>{score(grade.average)}</dd>
              </div>
            </dl>
          )}
        </section>
        <section className="panel inset-panel">
          <h3>Frequência</h3>
          {!records.length ? (
            <p className="empty">Nenhuma chamada registrada neste bimestre.</p>
          ) : (
            <>
              <dl className="student-summary-list">
                <div>
                  <dt>Aulas registradas</dt>
                  <dd>{records.length}</dd>
                </div>
                <div>
                  <dt>Presenças</dt>
                  <dd>{present}</dd>
                </div>
                <div>
                  <dt>Faltas</dt>
                  <dd>{absent}</dd>
                </div>
                <div>
                  <dt>Faltas justificadas</dt>
                  <dd>{justified}</dd>
                </div>
                <div>
                  <dt>Frequência</dt>
                  <dd>{frequency?.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</dd>
                </div>
              </dl>
              <div className="attendance-history">
                {records.map((item) => (
                  <div key={item.attendance_sessions.id}>
                    <time>{item.attendance_sessions.date.split("-").reverse().join("/")}</time>
                    <span>{statusLabel[item.status]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
