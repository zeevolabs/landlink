export function checkPassword(
  request: Request,
  password: string | undefined,
): { ok: boolean } {
  if (!password) return { ok: false };
  const provided = request.headers.get("x-admin-password") ?? "";
  return { ok: provided === password };
}
