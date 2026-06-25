import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("prepmind_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const persist = (token, u) => {
    localStorage.setItem("prepmind_token", token);
    localStorage.setItem("prepmind_user", JSON.stringify(u));
    setUser(u);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persist(data.token, data.user);
      return data.user;
    } finally { setLoading(false); }
  };

  const register = async (name, email, password, target_exam) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password, target_exam });
      persist(data.token, data.user);
      return data.user;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("prepmind_token");
    localStorage.removeItem("prepmind_user");
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    if (localStorage.getItem("prepmind_token") && !user) {
      api.get("/auth/me").then(({ data }) => {
        localStorage.setItem("prepmind_user", JSON.stringify(data));
        setUser(data);
      }).catch(() => {});
    }
  }, []); // eslint-disable-line

  return (
    <AuthCtx.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
