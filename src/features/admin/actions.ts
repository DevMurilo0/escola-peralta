import { z } from "zod";
import { requireSession } from "@/shared/services/session";
import { adminApi } from "@/shared/services/admin-api";
import { invalidateResources } from "@/shared/hooks/use-resource";
import { createMasterClass, createMasterTeacher } from "@/shared/services/master-api";
const classSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(100),
  grade_level: z.string().trim().min(2).max(80),
  shift: z.enum(["Manhã", "Tarde", "Integral"]),
  school_year: z.number().int().min(2000).max(2200),
  active: z.boolean(),
  teacher_id: z.uuid().optional(),
  group: z.enum(["1", "2", "3", "A", "B", "C"]).optional(),
});
export async function adminAction(
  kind: string,
  input: unknown,
): Promise<{ error?: string; success?: boolean; link?: string }> {
  try {
    const { client, user } = await requireSession(true);
    let result;
    if (kind === "class") {
      const { id, teacher_id, group, ...values } = classSchema.parse(input);
      if (id) {
        result = await client.from("classes").update(values).eq("id", id);
      } else {
        if (!teacher_id || !group)
          return { error: "Selecione a turma e o professor responsável." };
        const created = await createMasterClass({
          grade_level: values.grade_level as
            | "Infantil"
            | "Jardim"
            | "1º Ano"
            | "2º Ano"
            | "3º Ano"
            | "4º Ano"
            | "5º Ano",
          group,
          shift: values.shift,
          school_year: values.school_year,
          teacher_id,
        });
        if (created.error) return { error: created.error };
        invalidateResources();
        return { success: true };
      }
    } else if (kind === "master-teacher-create") {
      const values = z
        .object({
          full_name: z.string().trim().min(3).max(150),
          email: z.email().max(254),
          password: z.string().min(12).max(128),
        })
        .parse(input);
      const result = await createMasterTeacher(values);
      if (!result.error) invalidateResources();
      return result;
    } else if (kind === "teacher-edit") {
      const v = z
        .object({
          id: z.uuid(),
          full_name: z.string().trim().min(3).max(150),
          active: z.boolean(),
        })
        .parse(input);
      if (v.id === user.id)
        return {
          error: "Sua própria conta não pode ser desativada por esta tela.",
        };
      result = await client
        .from("profiles")
        .update({
          full_name: v.full_name,
          active: v.active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", v.id)
        .eq("role", "teacher");
    } else if (kind === "teacher-link") {
      return await adminApi("teachers/access-link", input);
    } else if (kind === "association") {
      const v = z
        .object({
          teacher_id: z.uuid(),
          class_id: z.uuid(),
          can_manage_students: z.boolean(),
        })
        .parse(input);
      result = await client.from("teacher_classes").insert(v);
    } else if (kind === "unlink") {
      const v = z.object({ id: z.uuid() }).parse(input);
      result = await client.from("teacher_classes").delete().eq("id", v.id);
    } else if (kind === "settings") {
      const v = z
        .object({
          school_year: z.number().int().min(2000).max(2200),
          passing_grade: z.number().min(0).max(10),
        })
        .parse(input);
      result = await client.from("school_settings").update(v).eq("id", true);
    } else return { error: "Operação inválida." };
    if (result?.error)
      return {
        error:
          result.error.code === "23505"
            ? "Este vínculo já existe."
            : result.error.code === "P0001"
              ? result.error.message
              : "Não foi possível salvar. Confira os campos e os vínculos existentes.",
      };
    invalidateResources();
    return { success: true };
  } catch {
    return {
      error:
        "Não foi possível concluir. Verifique os dados e a configuração do servidor.",
    };
  }
}
