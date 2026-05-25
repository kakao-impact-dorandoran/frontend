/**
 * Schedule API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST  /api/v1/schedules                    : 대화 일정 생성 (YOUTH/ADMIN)
 *  - GET   /api/v1/schedules/my                 : 내 일정 목록 (YOUTH/GUARDIAN/ADMIN)
 *  - PATCH /api/v1/schedules/{scheduleId}/cancel: 일정 취소 (YOUTH/ADMIN)
 */

import type {
  ScheduleCancelRequest,
  ScheduleCreateRequest,
  ScheduleResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function getMySchedules(): Promise<ScheduleResponse[]> {
  return apiRequest<ScheduleResponse[]>("/api/v1/schedules/my", {
    method: "GET",
    auth: "bearer",
  });
}

export function createSchedule(
  body: ScheduleCreateRequest,
): Promise<ScheduleResponse> {
  return apiRequest<ScheduleResponse>("/api/v1/schedules", {
    method: "POST",
    auth: "bearer",
    body,
  });
}

export function cancelSchedule(
  scheduleId: string,
  body?: ScheduleCancelRequest,
): Promise<ScheduleResponse> {
  return apiRequest<ScheduleResponse>(
    `/api/v1/schedules/${encodeURIComponent(scheduleId)}/cancel`,
    {
      method: "PATCH",
      auth: "bearer",
      body: body ?? {},
    },
  );
}
