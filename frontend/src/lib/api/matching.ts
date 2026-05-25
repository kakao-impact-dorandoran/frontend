/**
 * Matching API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET /api/v1/matching/elders             : 청년용 매칭 가능 어르신 목록
 *  - GET /api/v1/matching/elders/{elderId}   : 청년용 어르신 상세
 *  - GET /api/v1/matches/limit/me            : 청년 담당 인원 제한 현황
 *  - POST /api/v1/matches                    : 사전 인사말 기반 매칭 생성
 *  - GET /api/v1/matches/my                  : 내 매칭 목록 (YOUTH/GUARDIAN)
 *  - GET /api/v1/matches/{matchId}           : 매칭 상세 조회
 */

import type {
  MatchCreateRequest,
  MatchDetailResponse,
  MatchResponse,
  MatchSummaryResponse,
  MatchingElderDetailResponse,
  MatchingElderListParams,
  MatchingElderListResponse,
  YouthMatchLimitResponse,
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

export function getMatchingElderDetail(
  elderId: string,
): Promise<MatchingElderDetailResponse> {
  return apiRequest<MatchingElderDetailResponse>(
    `/api/v1/matching/elders/${encodeURIComponent(elderId)}`,
    { method: "GET", auth: "bearer" },
  );
}

export function getMyMatchLimit(): Promise<YouthMatchLimitResponse> {
  return apiRequest<YouthMatchLimitResponse>("/api/v1/matches/limit/me", {
    method: "GET",
    auth: "bearer",
  });
}

export function createMatch(body: MatchCreateRequest): Promise<MatchResponse> {
  return apiRequest<MatchResponse>("/api/v1/matches", {
    method: "POST",
    auth: "bearer",
    body,
  });
}

export function getMyMatches(): Promise<MatchSummaryResponse[]> {
  return apiRequest<MatchSummaryResponse[]>("/api/v1/matches/my", {
    method: "GET",
    auth: "bearer",
  });
}

export function getMatchDetail(matchId: string): Promise<MatchDetailResponse> {
  return apiRequest<MatchDetailResponse>(
    `/api/v1/matches/${encodeURIComponent(matchId)}`,
    { method: "GET", auth: "bearer" },
  );
}
