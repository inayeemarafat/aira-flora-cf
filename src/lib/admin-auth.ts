import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "aira-flora-admin-password";

/**
 * Client-side admin session: the admin password is kept in localStorage and
 * verified server-side on every admin server-function call.
 */
export function useAdminPassword() {
  const [password, setPasswordState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPasswordState(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const setPassword = useCallback((value: string | null) => {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPasswordState(value);
  }, []);

  return { password, setPassword };
}

export function isAuthError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Unauthorized");
}
