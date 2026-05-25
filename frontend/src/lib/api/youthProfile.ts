/**
 * Youth Profile API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST  /api/v1/youth/profile        : 등록
 *  - GET   /api/v1/youth/profile/me     : 내 프로필 조회
 *  - PATCH /api/v1/youth/profile/me     : 내 프로필 수정
 */

import type {
  YouthProfileCreateRequest,
  YouthProfileCreateResponse,
  YouthProfileResponse,
  YouthProfileUpdateRequest,
} from "../../types/api";
import { apiRequest } from "./client";

export function getMyYouthProfile(): Promise<YouthProfileResponse> {
  return apiRequest<YouthProfileResponse>("/api/v1/youth/profile/me", {
    method: "GET",
    auth: "bearer",
  });
}

export function createYouthProfile(
  req: YouthProfileCreateRequest,
): Promise<YouthProfileCreateResponse> {
  return apiRequest<YouthProfileCreateResponse>("/api/v1/youth/profile", {
    method: "POST",
    body: req,
    auth: "bearer",
  });
}

export function updateMyYouthProfile(
  req: YouthProfileUpdateRequest,
): Promise<YouthProfileResponse> {
  return apiRequest<YouthProfileResponse>("/api/v1/youth/profile/me", {
    method: "PATCH",
    body: req,
    auth: "bearer",
  });
}
