import { describe, it, expect } from "vitest";
import { average, age, gradeStatus, todayRecife } from "@/shared/academic/utils";
import {
  scoreSchema,
  termSchema,
  attendanceSchema,
  studentSchema,
} from "@/shared/academic/schemas";
describe("Regras acadêmicas", () => {
  it("calcula exatamente (atividade + prova) / 2", () => {
    expect(average(8, 9)).toBe(8.5);
    expect(average(0, 10)).toBe(5);
    expect(average(7.25, 8.5)).toBe(7.875);
    expect(average(null, 9)).toBeNull();
  });
  it.each([-1, 10.01, 15, NaN, Infinity, "8"])(
    "rejeita nota inválida %s",
    (v) => expect(scoreSchema.safeParse(v).success).toBe(false),
  );
  it.each([0, 10, 8.25, null])("aceita nota %s", (v) =>
    expect(scoreSchema.safeParse(v).success).toBe(true),
  );
  it("valida os quatro bimestres", () => {
    for (const n of [1, 2, 3, 4])
      expect(termSchema.safeParse(n).success).toBe(true);
    for (const n of [0, 5, 1.5, "1", null])
      expect(termSchema.safeParse(n).success).toBe(false);
  });
  it("calcula idade antes e depois do aniversário sem armazená-la", () => {
    expect(age("2018-09-12", "2026-09-11")).toBe(7);
    expect(age("2018-09-11", "2026-09-11")).toBe(8);
    expect(age("2020-02-29", "2025-02-28")).toBe(4);
    expect(age("2020-02-29", "2025-03-01")).toBe(5);
  });
  it("respeita Recife na virada UTC", () =>
    expect(todayRecife(new Date("2026-09-12T01:00:00Z"))).toBe("2026-09-11"));
  it("classifica média sem cores e aceita referência configurável", () => {
    expect(gradeStatus(null, 6)).toBe("Sem nota");
    expect(gradeStatus(6, 6)).toBe("Aprovado");
    expect(gradeStatus(6, 7)).toBe("Abaixo da média");
  });
  it("valida três status de presença", () => {
    for (const status of ["present", "absent", "justified"])
      expect(
        attendanceSchema.safeParse({
          student_id: "10000000-0000-4000-8000-000000000001",
          status,
        }).success,
      ).toBe(true);
    expect(
      attendanceSchema.safeParse({
        student_id: "10000000-0000-4000-8000-000000000001",
        status: "late",
      }).success,
    ).toBe(false);
  });
  it("não aceita nascimento futuro ou data impossível", () => {
    expect(
      studentSchema.safeParse({
        full_name: "Aluno Exemplo",
        birth_date: "2200-01-01",
      }).success,
    ).toBe(false);
    expect(
      studentSchema.safeParse({
        full_name: "Aluno Exemplo",
        birth_date: "2020-02-31",
      }).success,
    ).toBe(false);
  });
});
