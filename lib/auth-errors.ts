const AUTH_ERROR_CODES: Record<string, string> = {
  session_invalid: "La sesión no es válida. Vuelve a iniciar sesión.",
  no_session: "No se pudo iniciar sesión con Google.",
  PKCE_VERIFIER_MISSING:
    "Error de seguridad en el login. Vuelve a intentarlo desde el mismo navegador.",
  UNEXPECTED_ERROR: "Error inesperado. Inténtalo de nuevo.",
  INVALID_CREDENTIALS: "Email o contraseña incorrectos.",
  AUTH_UNAUTHORIZED: "Sesión expirada. Vuelve a iniciar sesión.",
  AUTH_TOKEN_EXPIRED: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
};

const MESSAGE_PATTERNS: [RegExp, string][] = [
  [
    /An unexpected error occurred during OAuth initialization/i,
    "No se pudo iniciar el login con Google. Comprueba tu conexión y que la URL de acceso esté autorizada en InsForge (p. ej. http://192.168.1.50:3000/api/auth/callback).",
  ],
  [
    /An unexpected error occurred during OAuth code exchange/i,
    "No se pudo completar el login con Google. Vuelve a intentarlo.",
  ],
  [
    /PKCE code verifier not found/i,
    AUTH_ERROR_CODES.PKCE_VERIFIER_MISSING,
  ],
  [
    /An unexpected error occurred during sign in/i,
    "Error al iniciar sesión. Comprueba email y contraseña.",
  ],
  [
    /An unexpected error occurred during sign up/i,
    "Error al crear la cuenta. Inténtalo de nuevo.",
  ],
  [
    /Invalid login credentials/i,
    AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  ],
  [
    /Failed to refresh auth session/i,
    AUTH_ERROR_CODES.AUTH_TOKEN_EXPIRED,
  ],
  [
    /No autenticado/i,
    "No has iniciado sesión.",
  ],
  [
    /Unauthorized/i,
    "No autorizado. Vuelve a iniciar sesión.",
  ],
];

export function translateAuthError(error: unknown): string {
  if (!error) return "Error desconocido";

  if (typeof error === "string") {
    return translateAuthMessage(error);
  }

  const err = error as { message?: string; error?: string };
  if (err.error === "UNEXPECTED_ERROR" && err.message) {
    return translateAuthMessage(err.message);
  }
  if (err.error && AUTH_ERROR_CODES[err.error]) {
    return AUTH_ERROR_CODES[err.error];
  }
  if (err.message) {
    return translateAuthMessage(err.message);
  }

  return "Error inesperado. Inténtalo de nuevo.";
}

export function translateAuthMessage(message: string): string {
  let decoded = message.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  if (AUTH_ERROR_CODES[decoded]) {
    return AUTH_ERROR_CODES[decoded];
  }

  for (const [pattern, translated] of MESSAGE_PATTERNS) {
    if (pattern.test(decoded)) return translated;
  }

  if (
    /sesión|contraseña|autentic|inválid|error/i.test(decoded) &&
    !/\b(the|your|failed to|unexpected error occurred)\b/i.test(decoded)
  ) {
    return decoded;
  }

  return "Error inesperado. Inténtalo de nuevo.";
}
