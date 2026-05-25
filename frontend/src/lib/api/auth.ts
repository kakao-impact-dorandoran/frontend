/**
 * Auth API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST /api/v1/auth/login
 *  - GET  /api/v1/users/me
 */

import type { AuthUserResponse, LoginRequest, LoginResponse } from "../../types/api";
import { apiRequest } from "./client";

export function login(req: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: req,
    auth: "none",
  });
}

export function getMe(): Promise<AuthUserResponse> {
  return apiRequest<AuthUserResponse>("/api/v1/users/me", {
    method: "GET",
    auth: "bearer",
  });
}
