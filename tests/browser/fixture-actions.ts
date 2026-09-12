// Isolated transport double for visual/interaction tests only. SQL persistence is tested separately.
export async function academicAction(kind: string, input: unknown) {
  window.dispatchEvent(
    new CustomEvent("fixture-save", { detail: { kind, input } }),
  );
  return { success: true, error: undefined };
}
export async function logout() {}
