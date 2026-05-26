/**
 * 사회참여 증명서 (Certificate) API 호출 wrapper.
 * 백엔드 컨트롤러 매핑 (CertificateController):
 *  - POST /api/v1/youth/certificates      : 증명서 발급 (YOUTH Bearer JWT)
 *  - GET  /api/v1/youth/certificates/me   : 내 증명서 목록 (YOUTH Bearer JWT)
 *
 * 백엔드 정책 요약:
 *  - 발급 기준 누적 시간: 10시간 (CertificateService.MINIMUM_ISSUE_HOURS)
 *  - requestedHours >= 10 이어야 함 (1 미만은 검증 400 C001)
 *  - availableCertificateHours >= requestedHours 여야 함 (아니면 409 CT003)
 *  - pdfUrl 은 현재 항상 null (PDF 실제 생성은 후순위)
 */

import type {
  CertificateIssueRequest,
  CertificateResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function getMyCertificates(): Promise<CertificateResponse[]> {
  return apiRequest<CertificateResponse[]>("/api/v1/youth/certificates/me", {
    method: "GET",
    auth: "bearer",
  });
}

export function issueCertificate(
  body: CertificateIssueRequest,
): Promise<CertificateResponse> {
  return apiRequest<CertificateResponse>("/api/v1/youth/certificates", {
    method: "POST",
    auth: "bearer",
    body,
  });
}
