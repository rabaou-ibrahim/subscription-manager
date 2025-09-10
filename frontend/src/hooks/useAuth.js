// src/hooks/useAuth.js
import { useEffect, useState, useCallback, useMemo } from "react";
import { storage } from "../lib/storage";
import { API, json } from "../services/http"; // keep your helper

export default function useAuth() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const isLogged = !!token;
  const roles = user?.roles || user?.role || []; // your backend uses ["ROLE_ADMIN"]
  const isAdmin = useMemo(
    () => Array.isArray(roles) && roles.includes("ROLE_ADMIN"),
    [roles]
  );

  // bootstrap
  useEffect(() => {
    (async () => {
      const t = await storage.get("token");
      if (t) {
        setToken(t);
        try {
          const me = await json(`${API}/api/user/me`, {
            headers: { Authorization: `Bearer ${t}` },
          });
          setUser(me);
        } catch {
          setToken(null);
          await storage.del("token");
        }
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await json(`${API}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const t = data?.token || data?.jwt || data?.id_token;
    if (!t) throw new Error(data?.message || "Login failed");
    await storage.set("token", t);
    setToken(t);

    const me = await json(`${API}/api/user/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    setUser(me);
    return { token: t, user: me };
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await storage.del("token");
  }, []);

  return { ready, isLogged, token, user, roles, isAdmin, login, logout, setUser };
}
