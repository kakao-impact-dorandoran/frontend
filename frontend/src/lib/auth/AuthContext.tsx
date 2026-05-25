import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUserResponse } from "../../types/api";
import { getMe, login as loginApi } from "../api/auth";
import { ApiError } from "../api/client";
import { clearTokens, getAccessToken, setTokens } from "./storage";

interface AuthContextValue {
  user: AuthUserResponse | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<AuthUserResponse>;
  logout: () => void;
  refreshMe: () => Promise<AuthUserResponse | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("idle");
  const bootstrappedRef = useRef(false);

  const refreshMe = useCallback(async (): Promise<AuthUserResponse | null> => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
    setStatus("loading");
    try {
      const me = await getMe();
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearTokens();
      }
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    try {
      const res = await loginApi({ email, password });
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      setStatus("authenticated");
      return res.user;
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refreshMe }),
    [user, status, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
