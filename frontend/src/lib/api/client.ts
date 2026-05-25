/**
 * 도란도란 백엔드 공통 fetch wrapper.
 *
 * - base URL: import.meta.env.VITE_API_BASE_URL (없으면 http://localhost:8080)
 * - JSON request/response
 * - accessToken 이 storage 에 있으면 Authorization: Bearer {token} 자동 첨부
 * - 에러 응답은 ApiError 로 throw
 * - 204 / 빈 body 는 null 반환
 */

import type { ApiErrorBody } from "../../types/api";
import { getAccessToken } from "../auth/storage";

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";
const API_BASE = RAW_BASE.replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, code: string | null, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export type AuthMode = "bearer" | "device" | "none";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /**
   * 기본 "bearer" — accessToken 이 있으면 Bearer 헤더 자동 첨부, 없으면 헤더 생략.
   * "device" — deviceToken 파라미터 필요.
   * "none" — Authorization 헤더 절대 첨부 안 함.
   */
  auth?: AuthMode;
  deviceToken?: string;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(API_BASE + normalized);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function buildAuthHeader(mode: AuthMode, deviceToken?: string): string | null {
  if (mode === "none") return null;
  if (mode === "device") {
    if (!deviceToken) throw new Error("apiRequest: deviceToken required for auth='device'");
    return `Device ${deviceToken}`;
  }
  const token = getAccessToken();
  return token ? `Bearer ${token}` : null;
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const auth = buildAuthHeader(opts.auth ?? "bearer", opts.deviceToken);
  if (auth) headers.Authorization = auth;

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (res.status === 204) {
    return null as T;
  }

  if (!res.ok) {
    const errBody = await parseErrorBody(res);
    const code = errBody?.code ?? null;
    const message = errBody?.message ?? `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, message, code, errBody);
  }

  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const apiBaseUrl = API_BASE;
