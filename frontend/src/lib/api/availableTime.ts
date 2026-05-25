/**
 * AvailableTime API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST /api/v1/available-times/youth                          : 청년 본인 가능 시간 등록
 *  - POST /api/v1/elders/{elderId}/available-times               : 보호자가 어르신 가능 시간 등록
 *  - GET  /api/v1/available-times?ownerType=&ownerId=            : 가능 시간 목록 조회
 */

import type {
  AvailableTimeCreateRequest,
  AvailableTimeOwnerType,
  AvailableTimeResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function createYouthAvailableTime(
  body: AvailableTimeCreateRequest,
): Promise<AvailableTimeResponse> {
  return apiRequest<AvailableTimeResponse>("/api/v1/available-times/youth", {
    method: "POST",
    auth: "bearer",
    body,
  });
}

export function getAvailableTimes(
  ownerType: AvailableTimeOwnerType,
  ownerId: string,
): Promise<AvailableTimeResponse[]> {
  return apiRequest<AvailableTimeResponse[]>("/api/v1/available-times", {
    method: "GET",
    auth: "bearer",
    query: { ownerType, ownerId },
  });
}

export function getMyYouthAvailableTimes(
  youthId: string,
): Promise<AvailableTimeResponse[]> {
  return getAvailableTimes("YOUTH", youthId);
}

export function createElderAvailableTime(
  elderId: string,
  body: AvailableTimeCreateRequest,
): Promise<AvailableTimeResponse> {
  return apiRequest<AvailableTimeResponse>(
    `/api/v1/elders/${elderId}/available-times`,
    {
      method: "POST",
      auth: "bearer",
      body,
    },
  );
}

export function getElderAvailableTimes(
  elderId: string,
): Promise<AvailableTimeResponse[]> {
  return getAvailableTimes("ELDER", elderId);
}
