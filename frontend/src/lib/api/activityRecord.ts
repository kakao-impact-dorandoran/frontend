/**
 * ActivityRecord / VolunteerStats API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST /api/v1/activity-records              : 활동 기록 작성 (YOUTH)
 *  - GET  /api/v1/activity-records              : 활동 기록 목록 (YOUTH/GUARDIAN/ADMIN)
 *  - GET  /api/v1/youth/volunteer-stats/me      : 청년 누적 활동 통계 (YOUTH)
 */

import type {
  ActivityRecordCreateRequest,
  ActivityRecordResponse,
  ActivityRecordSummaryResponse,
  YouthVolunteerStatsResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function getActivityRecords(): Promise<ActivityRecordSummaryResponse[]> {
  return apiRequest<ActivityRecordSummaryResponse[]>("/api/v1/activity-records", {
    method: "GET",
    auth: "bearer",
  });
}

export function createActivityRecord(
  body: ActivityRecordCreateRequest,
): Promise<ActivityRecordResponse> {
  return apiRequest<ActivityRecordResponse>("/api/v1/activity-records", {
    method: "POST",
    auth: "bearer",
    body,
  });
}

export function getMyVolunteerStats(): Promise<YouthVolunteerStatsResponse> {
  return apiRequest<YouthVolunteerStatsResponse>(
    "/api/v1/youth/volunteer-stats/me",
    { method: "GET", auth: "bearer" },
  );
}
