/**
 * 관리자 운영 큐 API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET   /api/v1/admin/help-requests?status=PENDING
 *  - PATCH /api/v1/admin/help-requests/{helpRequestId}
 *  - GET   /api/v1/admin/match-termination-requests?status=REQUESTED
 *  - PATCH /api/v1/admin/match-termination-requests/{requestId}
 *
 * 모든 endpoint 는 ADMIN role JWT 필요 (@PreAuthorize("hasRole('ADMIN')")).
 */

import type {
  AdminHelpRequestProcessRequest,
  AdminHelpRequestResponse,
  AdminMatchTerminationProcessRequest,
  AdminMatchTerminationResponse,
  HelpRequestStatus,
  MatchTerminationRequestStatus,
} from "../../types/api";
import { apiRequest } from "./client";

export function getAdminHelpRequests(
  status?: HelpRequestStatus,
): Promise<AdminHelpRequestResponse[]> {
  return apiRequest<AdminHelpRequestResponse[]>("/api/v1/admin/help-requests", {
    method: "GET",
    auth: "bearer",
    query: status ? { status } : undefined,
  });
}

export function processAdminHelpRequest(
  helpRequestId: string,
  body: AdminHelpRequestProcessRequest,
): Promise<AdminHelpRequestResponse> {
  return apiRequest<AdminHelpRequestResponse>(
    `/api/v1/admin/help-requests/${encodeURIComponent(helpRequestId)}`,
    { method: "PATCH", auth: "bearer", body },
  );
}

export function getAdminMatchTerminationRequests(
  status?: MatchTerminationRequestStatus,
): Promise<AdminMatchTerminationResponse[]> {
  return apiRequest<AdminMatchTerminationResponse[]>(
    "/api/v1/admin/match-termination-requests",
    {
      method: "GET",
      auth: "bearer",
      query: status ? { status } : undefined,
    },
  );
}

export function processAdminMatchTerminationRequest(
  requestId: string,
  body: AdminMatchTerminationProcessRequest,
): Promise<AdminMatchTerminationResponse> {
  return apiRequest<AdminMatchTerminationResponse>(
    `/api/v1/admin/match-termination-requests/${encodeURIComponent(requestId)}`,
    { method: "PATCH", auth: "bearer", body },
  );
}
