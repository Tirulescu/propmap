"use client";

import { useEffect, useState } from "react";

/** True solo tras el primer paint en el cliente (evita mismatch SSR en valores locales). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
