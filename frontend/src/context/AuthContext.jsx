import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import client, { tokenStore } from "../api/client";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  // Persist tokens to localStorage
  useEffect(() => {
    tokenStore.set(tokens);
  }, [tokens]);

  // Fetch profile when tokens change
  const loadMe = useCallback(async () => {
    if (!tokens?.access) {
      setUser(null);
      return;
    }
    setLoadingMe(true);
    try {
      const { data } = await client.get("/auth/me/");
      setUser(data); // {id, username, email, role}
    } catch {
      setUser(null);
    } finally {
      setLoadingMe(false);
    }
  }, [tokens]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  // Actions
  const login = useCallback(async (username, password) => {
    const { data } = await client.post("/auth/login/", { username, password });
    setTokens(data); // {access, refresh}
    return data;
  }, []);

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ tokens, user, loadingMe, login, logout, reloadProfile: loadMe }),
    [tokens, user, loadingMe, login, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
