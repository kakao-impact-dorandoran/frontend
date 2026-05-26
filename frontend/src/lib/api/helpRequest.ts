/**
 * HelpRequest API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST /api/v1/help-requests   (Authorization: Device {deviceToken})
 *
 * 도움 요청 생성은 전용 기기 인증(`Device {token}`)을 요구한다.
 * 관리자 목록/처리 API 는 이번 FE-5H 범위 밖이므로 wrapper 를 추가하지 않는다.
 */

import type {
  HelpRequestCreateRequest,
  HelpRequestResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function createHelpRequestByDevice(
  deviceToken: string,
  body?: HelpRequestCreateRequest | null,
): Promise<HelpRequestResponse> {
  return apiRequest<HelpRequestResponse>("/api/v1/help-requests", {
    method: "POST",
    auth: "device",
    deviceToken,
    body: body ?? {},
  });
}
