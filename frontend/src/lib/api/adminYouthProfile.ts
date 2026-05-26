/**
 * 관리자 청년 프로필 검수 API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET   /api/v1/admin/youths?approvalStatus=PENDING  : 청년 목록 조회
 *  - GET   /api/v1/admin/youths/{youthId}               : 청년 상세 조회
 *  - PATCH /api/v1/admin/youths/{youthId}/approval      : 승인/반려 처리
 *
 * 모든 endpoint 는 ADMIN role JWT 필요 (@PreAuthorize("hasRole('ADMIN')")).
 */

import type {
  AdminYouthApprovalRequest,
  AdminYouthApprovalResponse,
  AdminYouthApprovalStatus,
  AdminYouthDetailResponse,
  AdminYouthListResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function getAdminYouthProfiles(
  approvalStatus?: AdminYouthApprovalStatus,
): Promise<AdminYouthListResponse[]> {
  return apiRequest<AdminYouthListResponse[]>("/api/v1/admin/youths", {
    method: "GET",
    auth: "bearer",
    query: approvalStatus ? { approvalStatus } : undefined,
  });
}

export function getAdminYouthDetail(
  youthId: string,
): Promise<AdminYouthDetailResponse> {
  return apiRequest<AdminYouthDetailResponse>(
    `/api/v1/admin/youths/${encodeURIComponent(youthId)}`,
    { method: "GET", auth: "bearer" },
  );
}

export function approveAdminYouthProfile(
  youthId: string,
): Promise<AdminYouthApprovalResponse> {
  const body: AdminYouthApprovalRequest = { approvalStatus: "APPROVED" };
  return apiRequest<AdminYouthApprovalResponse>(
    `/api/v1/admin/youths/${encodeURIComponent(youthId)}/approval`,
    { method: "PATCH", auth: "bearer", body },
  );
}

export function rejectAdminYouthProfile(
  youthId: string,
  rejectionReason: string,
): Promise<AdminYouthApprovalResponse> {
  const body: AdminYouthApprovalRequest = {
    approvalStatus: "REJECTED",
    rejectionReason,
  };
  return apiRequest<AdminYouthApprovalResponse>(
    `/api/v1/admin/youths/${encodeURIComponent(youthId)}/approval`,
    { method: "PATCH", auth: "bearer", body },
  );
}
