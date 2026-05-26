/**
 * 신고 API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST  /api/v1/reports                          : 신고 접수 (YOUTH/GUARDIAN Bearer JWT)
 *  - GET   /api/v1/admin/reports?status=...         : 관리자 신고 목록 조회 (ADMIN Bearer JWT)
 *  - PATCH /api/v1/admin/reports/{reportId}         : 관리자 신고 처리 (ADMIN Bearer JWT)
 */

import type {
  AdminReportProcessRequest,
  AdminReportResponse,
  ReportCreateRequest,
  ReportResponse,
  ReportStatus,
} from "../../types/api";
import { apiRequest } from "./client";

export function createReport(body: ReportCreateRequest): Promise<ReportResponse> {
  return apiRequest<ReportResponse>("/api/v1/reports", {
    method: "POST",
    auth: "bearer",
    body,
  });
}

export function getAdminReports(
  status?: ReportStatus,
): Promise<AdminReportResponse[]> {
  return apiRequest<AdminReportResponse[]>("/api/v1/admin/reports", {
    method: "GET",
    auth: "bearer",
    query: status ? { status } : undefined,
  });
}

export function processAdminReport(
  reportId: string,
  body: AdminReportProcessRequest,
): Promise<AdminReportResponse> {
  return apiRequest<AdminReportResponse>(
    `/api/v1/admin/reports/${encodeURIComponent(reportId)}`,
    { method: "PATCH", auth: "bearer", body },
  );
}
