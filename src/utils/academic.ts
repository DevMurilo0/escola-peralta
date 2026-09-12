import { differenceInYears, parseISO } from "date-fns";
export function todayRecife(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function average(activity: number | null, exam: number | null) {
  return activity === null || exam === null ? null : (activity + exam) / 2;
}
export function age(birth: string, today = todayRecife()) {
  return differenceInYears(parseISO(today), parseISO(birth));
}
export function gradeStatus(value: number | null, minimum: number) {
  return value === null
    ? "Sem nota"
    : value >= minimum
      ? "Aprovado"
      : "Abaixo da média";
}

// Call numbers are visual, never a persistent student attribute.
export function alphabetical<T extends { students: { full_name: string }; student_id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.students.full_name.localeCompare(b.students.full_name, "pt-BR", { sensitivity: "base" }) || a.student_id.localeCompare(b.student_id));
}
export const callNumber = (index: number) => String(index + 1).padStart(2, "0");
export const termNames = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];
// Keep database column names: activity_score = 1ª Nota; exam_score = 2ª Nota.
export function parseScore(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Use notas de 0 a 10.");
  const score = Number(normalized);
  if (!Number.isFinite(score) || score < 0 || score > 10) throw new Error("Use notas de 0 a 10.");
  return score;
}
