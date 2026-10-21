import { useState, useTransition } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check, CalendarDays } from "lucide-react";
import { todayRecife, alphabetical, callNumber } from "@/shared/academic/utils";
import { academicAction } from "@/features/classes/academic-actions";
import { Feedback } from "@/shared/components/feedback";
import type { Enrollment, AttendanceSession, AttendanceRecord } from "@/shared/academic/types";
const labels = { present: "Presente", absent: "Falta", justified: "Falta justificada" };
type Records = Record<string, AttendanceRecord["status"] | "">;

export function StudentAttendanceView({ sessions, studentId, term }: {
  sessions: AttendanceSession[];
  studentId: string;
  term: number;
}) {
  const rows = sessions
    .filter((session) => session.term === term)
    .flatMap((session) => {
      const record = session.attendance_records.find((item) => item.student_id === studentId);
      return record ? [{ date: session.date, status: record.status }] : [];
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel call-panel student-attendance-view">
      <div className="page-heading">
        <div>
          <h2>Frequência diária</h2>
          <p className="muted">{term}º bimestre · consulta individual</p>
        </div>
      </div>
      {!rows.length ? (
        <div className="empty">Nenhuma frequência registrada para este aluno neste bimestre.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Data</th><th>Registro</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date.split("-").reverse().join("/")}</td>
                  <td><span className={`attendance-status ${row.status}`}>{labels[row.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export function AttendancePanel({ classId, year, term, enrollments, sessions, disabled, onDirty, onSaved }: {
  classId: string; year: number; term: number; enrollments: Enrollment[]; sessions: AttendanceSession[];
  disabled: boolean; onDirty: (dirty: boolean) => void; onSaved: () => void;
}) {
  const today = todayRecife();
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(() => parseISO(`${year}-${today.slice(5, 7)}-01`));
  const [calendar, setCalendar] = useState(false);
  const [draft, setDraft] = useState<Records | null>(null);
  const [snapshot, setSnapshot] = useState<AttendanceSession | null>(null);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const selected = snapshot?.date === date ? snapshot : sessions.find(s => s.date === date);
  const dirty = draft !== null;
  const records: Records = draft ?? (selected
    ? Object.fromEntries(selected.attendance_records.map(r => [r.student_id, r.status]))
    : Object.fromEntries(enrollments.filter(e => e.status === "active").map(e => [e.student_id, ""])));
  const rows = alphabetical(enrollments.filter(e => e.student_id in records));
  const wrongTerm = !!selected && selected.term !== term;
  const readOnly = disabled || wrongTerm || date > today || Number(date.slice(0, 4)) !== year;
  function openDay(day: string) {
    if (pending || day > today) return;
    if (dirty && !window.confirm("Descartar alterações não salvas desta chamada?")) return;
    setDate(day); setDraft(null); setSnapshot(null); onDirty(false); setMessage("");
  }
  function change(id: string, status: AttendanceRecord["status"]) {
    setDraft({ ...records, [id]: status }); onDirty(true);
  }
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const termSessions = sessions.filter(s => s.term === term);
  const totals = termSessions.flatMap(s => s.attendance_records);
  return <section>
    <div className="page-heading">
      <div><h2>Frequência diária</h2>
        <p className="attendance-date">{date === today && <strong>Hoje · </strong>}{format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        <span className="pill">{selected ? "Chamada realizada" : "Chamada ainda não realizada"}</span>
      </div>
      <div className="actions">
        <button className="secondary" disabled={pending} aria-expanded={calendar} aria-controls="attendance-calendar" onClick={() => setCalendar(!calendar)}><CalendarDays size={18} />Calendário</button>
        {date !== today && <button className="secondary" disabled={pending || year !== Number(today.slice(0, 4))} onClick={() => { setMonth(startOfMonth(parseISO(today))); openDay(today); }}>Hoje</button>}
      </div>
    </div>
    {calendar && <div className="panel calendar-panel daily-calendar" id="attendance-calendar">
      <div className="row">
        <button className="secondary icon-button" aria-label="Mês anterior" disabled={month.getMonth() === 0 || pending} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft /></button>
        <h3 className="capitalize">{format(month, "MMMM yyyy", { locale: ptBR })}</h3>
        <button className="secondary icon-button" aria-label="Próximo mês" disabled={month.getMonth() === 11 || pending} onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></button>
      </div>
      <div className="calendar-grid">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <span className="weekday" key={d}>{d}</span>)}
        {Array.from({ length: getDay(startOfMonth(month)) }, (_, i) => <span key={`empty-${i}`} />)}
        {days.map(day => {
          const iso = format(day, "yyyy-MM-dd"); const s = sessions.find(s => s.date === iso);
          return <button key={iso} disabled={iso > today || pending}
            aria-label={`${format(day, "dd/MM/yyyy")}${s ? `, chamada realizada no ${s.term}º bimestre` : ", sem chamada"}${iso === today ? ", hoje" : ""}${iso > today ? ", data futura" : ""}`}
            aria-pressed={date === iso} onClick={() => openDay(iso)}
            className={`calendar-day ${s ? "recorded" : ""} ${iso === today ? "today" : ""} ${date === iso ? "chosen" : ""}`}>
            <span>{day.getDate()}</span><small>{s ? <Check size={13} /> : iso === today ? "Hoje" : iso > today ? "—" : "·"}</small>
          </button>;
        })}
      </div>
      <div className="calendar-legend"><span>✓ Chamada realizada</span><span>· Sem chamada</span><span>— Data futura</span></div>
    </div>}
    {wrongTerm && <p role="alert">Esta chamada pertence ao {selected.term}º bimestre. Selecione esse bimestre para editá-la.</p>}
    {Number(date.slice(0, 4)) !== year && <p>Selecione no calendário uma data do ano letivo {year}.</p>}
    <Feedback message={message} />
    <section className="panel call-panel">
      <div className="page-heading"><h3>Alunos da chamada</h3><button className="secondary" disabled={readOnly || pending || !rows.length} onClick={() => {
        setDraft(Object.fromEntries(Object.keys(records).map(id => [id, "present"]))); onDirty(true);
      }}>Marcar todos como presentes</button></div>
      {!rows.length ? <div className="empty">Nenhum aluno cadastrado. Adicione alunos ativos à turma para fazer a chamada.</div> : <>
        <div className="call-counts" aria-live="polite">
          {Object.entries({ present: "Presentes", absent: "Faltas", justified: "Justificadas" }).map(([status, label]) => <span key={status}>{label}: <strong>{Object.values(records).filter(v => v === status).length}</strong></span>)}
          <span>Total: <strong>{rows.length}</strong></span>
        </div>
        {rows.map((e, index) => <fieldset className="attendance-row" key={e.student_id} disabled={readOnly || pending}>
          <legend><span className="call-number">{callNumber(index)}</span> {e.students.full_name}</legend>
          <div className="attendance-options">{Object.entries(labels).map(([value, label]) => <label key={value} className={records[e.student_id] === value ? `checked ${value}` : ""}>
            <input type="radio" name={`presence-${e.student_id}`} checked={records[e.student_id] === value} onChange={() => change(e.student_id, value as AttendanceRecord["status"])} />{label}
          </label>)}</div>
        </fieldset>)}
        <div className="save-bar"><p className="muted small">{dirty ? "Alterações ainda não salvas." : selected ? "Registros carregados." : "Marque a presença de todos os alunos."}</p>
          <button disabled={readOnly || pending || !dirty || Object.values(records).some(v => !v)} onClick={() => start(async () => {
            setMessage("Salvando...");
            try {
              const result = await academicAction("attendance", { class_id: classId, date, term, expected: selected?.updated_at || null, rows: Object.entries(records).map(([student_id, status]) => ({ student_id, status })) });
              if (result.error) { setMessage(`Erro ao salvar: ${result.error}`); onSaved(); return; }
              if (result.savedSession) setSnapshot(result.savedSession as AttendanceSession);
              setDraft(null); onDirty(false); setMessage("Frequência salva."); onSaved();
            } catch { setMessage("Erro ao salvar frequência. Seus registros continuam nesta tela."); }
          })}>{pending ? "Salvando..." : "Salvar frequência"}</button>
        </div>
      </>}
    </section>
    <details className="attendance-term-summary"><summary>Resumo do bimestre · {termSessions.length} chamadas</summary>
      {termSessions.length ? <p>{totals.filter(r => r.status === "present").length} presenças · {totals.filter(r => r.status === "absent").length} faltas · {totals.filter(r => r.status === "justified").length} justificadas</p> : <p>Nenhuma frequência registrada neste bimestre.</p>}
    </details>
  </section>;
}
