// src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import api from "../api/client";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tokens"));
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        setLoadingMe(true);

        if (tokens?.refresh && !tokens?.access) {
          const r = await api.post("/auth/refresh/", { refresh: tokens.refresh });
          if (!cancelled) {
            const next = { ...tokens, access: r.data.access };
            setTokens(next);
            localStorage.setItem("tokens", JSON.stringify(next));
          }
        }

        if (!tokens?.access) return;

        const me = await api.get("/auth/me/");
        if (!cancelled) setUser(me.data);
      } catch {
        if (!cancelled) {
          setUser(null);
          setTokens(null);
          localStorage.removeItem("tokens");
        }
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  // ✅ yeh naya login function
  const login = async (username, password) => {
    const r = await api.post("/auth/login/", { username, password });
    const nextTokens = r.data;
    setTokens(nextTokens);
    localStorage.setItem("tokens", JSON.stringify(nextTokens));

    const me = await api.get("/auth/me/");
    setUser(me.data);
    return me.data; // is se Login.jsx ko role mil jayega
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("tokens");
  };

  const value = {
    tokens,
    setTokens,
    user,
    setUser,
    loadingMe,
    login,     // ✅ make sure yahan expose ho
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
