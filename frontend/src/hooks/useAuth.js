// src/hooks/useAuth.js
import React, {
  createContext, useContext, useEffect, useState, useCallback, useMemo
} from "react";
import { storage } from "../lib/storage";
import { json } from "../services/http";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady]   = useState(false);
  const [token, setToken]   = useState(null);
  const [user,  setUser]    = useState(null);

  const isLogged = !!token;

  const rawRoles = user?.roles ?? user?.role ?? [];
  const rolesArr = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);

  const isAdmin = useMemo(() => rolesArr.includes("ROLE_ADMIN"), [rolesArr]);
  const hasAnyRole = useCallback(
    (required = []) => !required?.length || required.some(r => rolesArr.includes(r)),
    [rolesArr]
  );

  useEffect(() => {
    (async () => {
      const t = await storage.get("token");
      if (t) {
        setToken(t);
        try {
          const me = await json("/api/user/me", { headers: { Authorization: `Bearer ${t}` } });
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
    try {
      const data = await json("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const t = data?.token || data?.jwt || data?.id_token;
      if (!t) throw new Error(data?.message || data?.error || "No token received");

      await storage.set("token", t);
      setToken(t);

      const me = await json("/api/user/me", { headers: { Authorization: `Bearer ${t}` } });
      setUser(me);
      return { token: t, user: me };
    } catch (e) {
      let msg = e?.message || "Connexion impossible";
      if (e?.status === 401 || /invalid/i.test(msg) || /identifiant/i.test(msg)) {
        msg = "Email ou mot de passe incorrect";
      }
      const err = new Error(msg);
      err.status = e?.status;
      err.data = e?.data;
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    const body = {
      firstname: payload.firstname?.trim(),
      lastname:  payload.lastname?.trim(),
      email:     payload.email?.trim(),
      password:  payload.password,
      username:  payload.username ?? null,
      phone_number: payload.phone_number ?? null,
      age: (payload.age ?? "") === "" ? null : Number(payload.age),
      avatar: payload.avatar ?? null,
      roles: ["ROLE_USER"],
      is_active: true,
    };
    return json("/api/user/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await storage.del("token");
  }, []);

  const value = {
    ready,
    isLogged,
    isAuthenticated: isLogged, // alias pour compat
    token,
    user,
    roles: rolesArr,
    isAdmin,
    hasAnyRole,                // 👈 exposé pour RoleGuard
    login,
    logout,
    setUser,
    register,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default function useAuth() {
  return useContext(AuthCtx);
}
