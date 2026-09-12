import { z } from "zod";
import { todayRecife } from "@/shared/academic/utils";

export const termSchema = z.number().int().min(1).max(4);
export const scoreSchema = z.number().min(0).max(10).nullable();
export const dateSchema = z.iso.date();
export const studentSchema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo.").max(150),
  birth_date: dateSchema.refine(
    (v) => v <= todayRecife(),
    "A data não pode ser futura.",
  ),
});
export const gradeSchema = z.object({
  student_id: z.uuid(),
  activity_score: scoreSchema,
  exam_score: scoreSchema,
});
export const attendanceSchema = z.object({
  student_id: z.uuid(),
  status: z.enum(["present", "absent", "justified"]),
});
export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres."),
});

export const classSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da turma.").max(100),
  grade_level: z.string().trim().min(1, "Informe a série/ano.").max(100),
  shift: z.enum(["Manhã", "Tarde", "Integral"]),
  school_year: z.number().int().min(2000).max(2200),
}).strict();
export const curriculumSchema = z.object({
  date: dateSchema,
  subject: z.string().trim().min(1, "Informe o componente curricular.").max(150),
  content: z.string().trim().min(1, "Informe o conteúdo trabalhado.").max(10000),
});
