import { createClient } from "@supabase/supabase-js";
const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD",
  "BOOTSTRAP_ADMIN_NAME",
];
for (const key of required)
  if (!process.env[key]) throw new Error(`Defina ${key} em .dev.vars`);
if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12)
  throw new Error("A senha deve conter pelo menos 12 caracteres.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { count, error: check } = await db
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "admin")
  .eq("active", true);
if (check) throw check;
if (count)
  throw new Error(
    "Já existe administrador ativo. Use o acesso existente; este script é apenas para o primeiro admin.",
  );
const { data, error } = await db.auth.admin.createUser({
  email: process.env.BOOTSTRAP_ADMIN_EMAIL,
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: process.env.BOOTSTRAP_ADMIN_NAME },
});
if (error) throw error;
const { error: update } = await db
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", data.user.id);
if (update)
  throw new Error(
    `Conta criada (${data.user.id}), mas a promoção falhou. No SQL Editor, confira e promova esse UUID manualmente. ${update.message}`,
  );
console.log(
  "Primeiro administrador criado. Remova as variáveis BOOTSTRAP_ADMIN_* de .dev.vars.",
);
