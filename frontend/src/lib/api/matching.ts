/**
 * Matching API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET /api/v1/matching/elders : 청년용 매칭 가능 어르신 목록
 */

import type {
  MatchingElderListParams,
  MatchingElderListResponse,
} from "../../types/api";
import { apiRequest } from "./client";

export function getMatchingElders(
  params?: MatchingElderListParams,
): Promise<MatchingElderListResponse[]> {
  return apiRequest<MatchingElderListResponse[]>("/api/v1/matching/elders", {
    method: "GET",
    auth: "bearer",
    query: params,
  });
}
