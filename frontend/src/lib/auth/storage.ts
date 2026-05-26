/**
 * accessToken / refreshToken 영구 저장소.
 * MVP 단계라 localStorage 사용 — XSS 대응은 후순위.
 */

import type { AuthUserResponse } from "../../types/api";

const ACCESS_TOKEN_KEY = "dorandoran.accessToken";
const REFRESH_TOKEN_KEY = "dorandoran.refreshToken";
const DEMO_USER_KEY = "dorandoran.demoUser";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken?: string | null): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    void 0;
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(DEMO_USER_KEY);
  } catch {
    void 0;
  }
}

export function getDemoUser(): AuthUserResponse | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(DEMO_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUserResponse;
  } catch {
    return null;
  }
}

export function setDemoUser(user: AuthUserResponse): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  } catch {
    void 0;
  }
}

export function clearDemoUser(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DEMO_USER_KEY);
  } catch {
    void 0;
  }
}
