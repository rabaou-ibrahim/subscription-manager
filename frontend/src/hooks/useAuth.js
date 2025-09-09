// frontend/src/hooks/useAuth.js
import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from "../services/auth";
// (Facultatif si tu as déjà un store Zustand)
try {
  // eslint-disable-next-line global-require
  var { useAccountStore } = require("../store/account");
} catch {
  // Fallback si le store n'existe pas
  var useAccountStore = () => ({ account: null, setAccount: () => {}, restoreAccount: () => {} });
}

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { account, setAccount, restoreAccount } = useAccountStore();

  const isAuthenticated = !!token;

  // Charger token + profil au montage
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
      if (t) {
        try {
          const user = await apiMe();
          setAccount?.(user);
        } catch {
          await AsyncStorage.removeItem("token");
          setToken(null);
          restoreAccount?.();
        }
      } else {
        restoreAccount?.();
      }
      setLoading(false);
    })();
  }, [setAccount, restoreAccount]);

  // Helpers rôles (ton champ: "role" = tableau de rôles)
  const roles = useMemo(() => {
    const r = account?.role || account?.roles || [];
    return Array.isArray(r) ? r : [];
  }, [account]);

  const hasRole = useCallback((r) => roles.includes(r), [roles]);
  const hasAnyRole = useCallback((arr) => arr?.some?.((r) => roles.includes(r)), [roles]);
  const isAdmin = useMemo(() => hasRole("ROLE_ADMIN"), [hasRole]);

  // Actions
  const doLogin = useCallback(async (email, password) => {
    const t = await apiLogin(email, password);
    setToken(t);
    const user = await apiMe();
    setAccount?.(user);
    return user;
  }, [setAccount]);

  const doRegister = useCallback(async (payload) => {
    await apiRegister(payload);
    // On laisse l’écran appeler doLogin ensuite si besoin
    return true;
  }, []);

  const doLogout = useCallback(async () => {
    await apiLogout();
    setToken(null);
    restoreAccount?.();
  }, [restoreAccount]);

  return {
    loading,
    isAuthenticated,
    token,
    user: account || null,
    roles,
    hasRole,
    hasAnyRole,
    isAdmin,
    login: doLogin,
    register: doRegister,
    logout: doLogout,
  };
}
