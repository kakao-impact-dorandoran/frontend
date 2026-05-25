/**
 * Elder (보호자/기관 소유 어르신) API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET /api/v1/elders/my  : 내가 등록한 어르신 목록
 *
 * 등록/수정 API 는 이번 작업(FE-4B) 범위가 아니므로 미구현.
 */

import type { ElderResponse } from "../../types/api";
import { apiRequest } from "./client";

export function getMyElders(): Promise<ElderResponse[]> {
  return apiRequest<ElderResponse[]>("/api/v1/elders/my", {
    method: "GET",
    auth: "bearer",
  });
}
