/**
 * 관리자 사용자 제재 API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - PATCH /api/v1/admin/users/{userId}/ban
 *
 * 모든 endpoint 는 ADMIN role JWT 필요 (@PreAuthorize("hasRole('ADMIN')")).
 * 제재 해제 API 는 현재 백엔드에 없음 (FRONTEND_API_HANDOFF.md §7.4 기준).
 */

import type { AdminUserBanRequest, AdminUserBanResponse } from "../../types/api";
import { apiRequest } from "./client";

export function banAdminUser(
  userId: string,
  body: AdminUserBanRequest,
): Promise<AdminUserBanResponse> {
  return apiRequest<AdminUserBanResponse>(
    `/api/v1/admin/users/${encodeURIComponent(userId)}/ban`,
    { method: "PATCH", auth: "bearer", body },
  );
}
