import { db } from "@/shared/supabase/client";
import { classSchema } from "@/shared/academic/schemas";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { z } from "zod";

export async function saveClass(input: unknown, id?: string, active = true) {
  const values = classSchema.parse(input);
  const params = { p_name: values.name, p_grade_level: values.grade_level, p_shift: values.shift, p_school_year: values.school_year };
  const { data, error } = id
    ? await db().rpc("update_teacher_class", { ...params, p_class: z.uuid().parse(id), p_active: active })
    : await db().rpc("create_teacher_class", params);
  if (error) throw new Error(error.code === "P0001" ? error.message : "Não foi possível salvar a turma. Verifique sua conexão e permissão.");
  invalidateResources();
  return id || z.uuid().parse(data);
}
