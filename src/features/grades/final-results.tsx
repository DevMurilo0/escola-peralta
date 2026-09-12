import type { Enrollment, Grade } from "@/shared/academic/types";
import { alphabetical, callNumber, termNames } from "@/shared/academic/utils";
const FINAL_PASSING_GRADE = 6;
const formatAverage = (value: number) => value.toLocaleString("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 4,
});
export default function FinalResults({ enrollments, grades }: { enrollments: Enrollment[]; grades: Grade[] }) {
  const byStudent = new Map<string, Map<number, number | null>>();
  for (const grade of grades) {
    if (!byStudent.has(grade.student_id)) byStudent.set(grade.student_id, new Map());
    byStudent.get(grade.student_id)!.set(grade.term, grade.average);
  }
  return <section className="panel"><h2>Resultado final</h2>
    <p className="muted">Média anual = (média do I + II + III + IV bimestres) ÷ 4. Média mínima: 6,0.</p>
    {!enrollments.length ? <p className="empty">Nenhum aluno cadastrado.</p> : <div className="table-scroll"><table className="final-results">
      <thead><tr><th>Nº</th><th>Aluno</th>{termNames.map(name => <th key={name}>{name}</th>)}<th>Média anual</th><th>Situação</th></tr></thead>
      <tbody>{alphabetical(enrollments).map((e, index) => {
        const values = [1, 2, 3, 4].map(term => byStudent.get(e.student_id)?.get(term) ?? null);
        const complete = values.every((value): value is number => value !== null);
        const annualAverage = complete ? values.reduce((sum, value) => sum + value, 0) / 4 : null;
        return <tr key={e.id}><td className="call-number">{callNumber(index)}</td><th scope="row">{e.students.full_name}{e.status !== "active" && <small> · Matrícula inativa</small>}</th>
          {values.map((value, i) => <td key={i}>{value === null ? "—" : formatAverage(Number(value))}</td>)}
          <td>{annualAverage === null ? "—" : formatAverage(annualAverage)}</td>
          <td>{annualAverage === null ? "Em andamento" : annualAverage >= FINAL_PASSING_GRADE ? "Aprovado" : "Abaixo da média"}</td></tr>;
      })}</tbody>
    </table></div>}
  </section>;
}
