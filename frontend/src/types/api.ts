/**
 * 도란도란 백엔드 v2.0 API 타입 정의
 * 기준 문서: /workspace/backend/docs/FRONTEND_API_HANDOFF.md
 */

// ---------- 공통 enum ----------
export type UserRole = "YOUTH" | "GUARDIAN" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";

export type YouthApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export type YouthActivityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE" | null;

// ---------- Auth ----------
export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileUrl: string | null;
  status: UserStatus;
  partnerCode: string | null;
  approvalStatus: YouthApprovalStatus;
  rejectionReason: string | null;
  activityStatus: YouthActivityStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}

// ---------- 공통 에러 ----------
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  errors: Array<{ field: string; value: unknown; reason: string }> | null;
}

/**
 * 서버 에러 코드 (HTTP 상태와 별개로 분기 기준).
 * 전체 enum 은 backend ErrorCode.java 참고. 여기엔 프론트 분기에 자주 쓰이는 것만.
 */
export const ErrorCode = {
  // 인증/계정
  INVALID_INPUT: "C001",
  ACCESS_DENIED: "C006",
  UNAUTHORIZED: "C007",
  PASSWORD_MISMATCH: "U003",
  ACCOUNT_SUSPENDED: "U004",
  YOUTH_PENDING: "U005",
  YOUTH_REJECTED: "U006",
  JWT_INVALID: "A001",
  JWT_EXPIRED: "A002",
  YOUTH_KEYWORD_LIMIT_EXCEEDED: "Y001",
  YOUTH_FORBIDDEN_WORD: "Y002",
  YOUTH_PROFILE_NOT_FOUND: "Y003",
  YOUTH_PROFILE_ALREADY_EXISTS: "Y004",
  // 매칭
  MATCH_LIMIT_EXCEEDED: "M001",
  DUPLICATE_MATCH: "M004",
  ICEBREAKING_MESSAGE_REQUIRED: "M005",
  ELDER_NOT_AVAILABLE: "M006",
  // 가능 시간
  AVAILABLE_TIME_NOT_FOUND: "AT001",
  INVALID_AVAILABLE_TIME_RANGE: "AT002",
  AVAILABLE_TIME_OVERLAPPED: "AT003",
  AVAILABLE_TIME_ACCESS_DENIED: "AT004",
  INVALID_AVAILABLE_TIME_QUERY: "AT005",
  // 일정
  SCHEDULE_CONFLICT: "SC001",
  SCHEDULE_NOT_FOUND: "SC002",
  INVALID_SCHEDULE_TIME_RANGE: "SC003",
  SCHEDULE_ACCESS_DENIED: "SC004",
  SCHEDULE_ALREADY_CANCELED: "SC005",
  SCHEDULE_ALREADY_COMPLETED: "SC006",
  MATCH_NOT_SCHEDULABLE: "SC007",
  SCHEDULE_OUT_OF_AVAILABLE_TIME: "SC008",
  // 매칭 조회/접근
  MATCH_NOT_FOUND: "M002",
  MATCH_ACCESS_DENIED: "M003",
  // 매칭 중단 요청
  MATCH_TERMINATION_REQUEST_NOT_FOUND: "MT001",
  MATCH_TERMINATION_ALREADY_REQUESTED: "MT002",
  INVALID_MATCH_TERMINATION_STATUS: "MT003",
  MATCH_TERMINATION_ACCESS_DENIED: "MT004",
  MATCH_ALREADY_ENDED: "MT005",
  // 활동 기록
  ACTIVITY_RECORD_DUPLICATED: "AR001",
  ACTIVITY_RECORD_NOT_FOUND: "AR002",
  ACTIVITY_RECORD_ACCESS_DENIED: "AR003",
  ACTIVITY_RECORD_DUPLICATED_CALL_LOG: "AR004",
  INVALID_ACTIVITY_DURATION: "AR005",
  CALL_LOG_NOT_COMPLETED: "AR006",
  ACTIVITY_MATCH_MISMATCH: "AR007",
  ACTIVITY_SCHEDULE_MISMATCH: "AR008",
  ACTIVITY_CALL_LOG_MISMATCH: "AR009",
  ACTIVITY_MATCH_NOT_RECORDABLE: "AR010",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------- Youth Profile ----------
/**
 * 청년 프로필 응답.
 * 백엔드 DTO: YouthProfileResponse
 * 엔드포인트: GET /api/v1/youth/profile/me, PATCH /api/v1/youth/profile/me
 */
export interface YouthProfileResponse {
  profileId: string;
  youthId: string;
  profileImageUrl: string | null;
  keywords: string[] | null;
  greetingComment: string;
  voiceSampleUrl: string | null;
  approvalStatus: YouthApprovalStatus;
  rejectionReason: string | null;
  activityStatus: YouthActivityStatus;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 청년 프로필 등록 응답.
 * 백엔드 DTO: YouthProfileCreateResponse
 * 엔드포인트: POST /api/v1/youth/profile
 */
export interface YouthProfileCreateResponse {
  profileId: string;
  isCompleted: boolean;
  approvalStatus: YouthApprovalStatus;
  rejectionReason: string | null;
}

/**
 * 청년 프로필 등록 요청.
 * 백엔드 DTO: YouthProfileCreateRequest
 * - keywords: 최대 5개
 * - greetingComment: 필수, 최대 50자
 */
export interface YouthProfileCreateRequest {
  profileImageUrl?: string | null;
  keywords?: string[] | null;
  greetingComment: string;
  voiceSampleUrl?: string | null;
}

/**
 * 청년 프로필 수정 요청.
 * 백엔드 DTO: YouthProfileUpdateRequest
 * - 모든 필드 optional. greetingComment 보내면 최대 50자.
 */
export interface YouthProfileUpdateRequest {
  profileImageUrl?: string | null;
  keywords?: string[] | null;
  greetingComment?: string | null;
  voiceSampleUrl?: string | null;
}

// ---------- Elder / Matching ----------
export type Gender = "MALE" | "FEMALE";
export type CallType = "VIDEO" | "AUDIO";
export type DifficultyLevel = "LOW" | "MEDIUM" | "HIGH";
export type ElderStatus = "AVAILABLE" | "MATCHED" | "INACTIVE";

/**
 * 청년용 매칭 가능 어르신 목록 응답.
 * 백엔드 DTO: MatchingElderListResponse
 * 엔드포인트: GET /api/v1/matching/elders
 * - 주소/연락처 등 민감정보는 응답에 포함되지 않음.
 */
export interface MatchingElderListResponse {
  elderId: string;
  name: string;
  ageGroup: string;
  gender: Gender;
  profileImageUrl: string | null;
  greetingComment: string;
  interests: string[] | null;
  preferredCallType: CallType;
  difficultyLevel: DifficultyLevel;
  status: ElderStatus;
}

/**
 * GET /api/v1/matching/elders query parameter.
 * - availableFrom/availableTo 는 둘 다 지정해야 시간 범위 필터가 적용됨.
 * - 시각은 Asia/Seoul 기준 wall clock (ISO-8601, 타임존 suffix 금지).
 */
export interface MatchingElderListParams {
  interest?: string;
  preferredCallType?: CallType;
  difficultyLevel?: DifficultyLevel;
  availableFrom?: string;
  availableTo?: string;
}

/**
 * 청년용 어르신 상세 응답.
 * 백엔드 DTO: MatchingElderDetailResponse
 * 엔드포인트: GET /api/v1/matching/elders/{elderId}
 * - AVAILABLE 상태 어르신만 조회 가능.
 */
export interface MatchingElderDetailResponse {
  elderId: string;
  name: string;
  ageGroup: string;
  gender: Gender;
  profileImageUrl: string | null;
  greetingComment: string;
  interests: string[] | null;
  preferredCallType: CallType;
  difficultyLevel: DifficultyLevel;
  requestNotes: string | null;
  status: ElderStatus;
}

export type MatchStatus = "MATCHED" | "IN_PROGRESS" | "TERMINATION_REQUESTED" | "ENDED";

/**
 * 매칭 생성 요청.
 * 백엔드 DTO: MatchCreateRequest
 * - elderId, icebreakingMessage 모두 필수.
 */
export interface MatchCreateRequest {
  elderId: string;
  icebreakingMessage: string;
}

/**
 * 매칭 생성/단건 응답.
 * 백엔드 DTO: MatchResponse
 * 엔드포인트: POST /api/v1/matches
 */
export interface MatchResponse {
  matchId: string;
  youthId: string;
  elderId: string;
  status: MatchStatus;
  icebreakingMessage: string;
  selectedAt: string;
  matchedAt: string | null;
  endedAt: string | null;
}

/**
 * 청년 담당 인원 제한 응답.
 * 백엔드 DTO: YouthMatchLimitResponse
 * 엔드포인트: GET /api/v1/matches/limit/me
 */
export interface YouthMatchLimitResponse {
  youthId: string;
  currentMatchCount: number;
  maxMatchCount: number;
  remainingMatchCount: number;
  canMatch: boolean;
}

/**
 * 내 매칭 목록 응답.
 * 백엔드 DTO: MatchSummaryResponse
 * 엔드포인트: GET /api/v1/matches/my (YOUTH/GUARDIAN)
 */
export interface MatchSummaryResponse {
  matchId: string;
  youthId: string;
  youthName: string;
  elderId: string;
  elderName: string;
  status: MatchStatus;
  icebreakingMessage: string;
  selectedAt: string;
  matchedAt: string | null;
  endedAt: string | null;
}

/**
 * 매칭 상세 응답 - 어르신 요약 정보.
 * 백엔드 DTO: MatchDetailResponse.ElderSummary
 */
export interface MatchDetailElderSummary {
  elderId: string;
  name: string;
  ageGroup: string;
  interests: string[] | null;
  preferredCallType: CallType;
  difficultyLevel: DifficultyLevel;
}

/**
 * 매칭 상세 응답 - 청년 요약 정보.
 * 백엔드 DTO: MatchDetailResponse.YouthSummary
 */
export interface MatchDetailYouthSummary {
  youthId: string;
  name: string;
}

/**
 * 매칭 상세 응답.
 * 백엔드 DTO: MatchDetailResponse
 * 엔드포인트: GET /api/v1/matches/{matchId} (YOUTH/GUARDIAN/ADMIN)
 */
export interface MatchDetailResponse {
  matchId: string;
  status: MatchStatus;
  icebreakingMessage: string;
  selectedAt: string;
  matchedAt: string | null;
  endedAt: string | null;
  youth: MatchDetailYouthSummary;
  elder: MatchDetailElderSummary;
}

// ---------- Elder (GUARDIAN 측) ----------
/**
 * 보호자/기관이 등록한 어르신 응답.
 * 백엔드 DTO: ElderResponse
 * 엔드포인트:
 *  - GET /api/v1/elders/my           (GUARDIAN, 본인 어르신 목록)
 *  - POST /api/v1/elders             (GUARDIAN, 어르신 등록 — 이번 작업 범위 아님)
 *  - PATCH /api/v1/elders/{elderId}  (GUARDIAN, 어르신 수정 — 이번 작업 범위 아님)
 *
 * 매칭 화면(MatchingElderListResponse / MatchingElderDetailResponse)과 달리
 * 민감정보(phoneNumber/address)를 포함한다.
 */
export interface ElderResponse {
  elderId: string;
  guardianId: string;
  name: string;
  ageGroup: string;
  gender: Gender;
  profileImageUrl: string | null;
  greetingComment: string;
  phoneNumber: string | null;
  address: string | null;
  interests: string[] | null;
  preferredCallType: CallType;
  difficultyLevel: DifficultyLevel;
  requestNotes: string | null;
  status: ElderStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------- AvailableTime ----------
/**
 * 백엔드 enum: AvailableTimeOwnerType
 */
export type AvailableTimeOwnerType = "YOUTH" | "ELDER";

/**
 * 가능 시간 응답.
 * 백엔드 DTO: AvailableTimeResponse
 * 엔드포인트:
 *  - POST /api/v1/available-times/youth                       (YOUTH 본인 등록)
 *  - GET  /api/v1/available-times?ownerType=&ownerId=         (YOUTH/GUARDIAN/ADMIN)
 *
 * 시간은 모두 Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface AvailableTimeResponse {
  availableTimeId: string;
  ownerType: AvailableTimeOwnerType;
  ownerId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

/**
 * 청년 가능 시간 등록 요청.
 * 백엔드 DTO: AvailableTimeCreateRequest
 * - startTime, endTime: LocalDateTime (예: "2026-05-25T14:00:00")
 * - startTime < endTime 필수 (AT002)
 * - 동일 owner 기존 시간과 겹치면 AT003
 */
export interface AvailableTimeCreateRequest {
  startTime: string;
  endTime: string;
}

// ---------- Schedule ----------
/**
 * 백엔드 enum: ScheduleStatus
 */
export type ScheduleStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

/**
 * 일정 응답.
 * 백엔드 DTO: ScheduleResponse
 * 엔드포인트:
 *  - POST  /api/v1/schedules
 *  - GET   /api/v1/schedules/my
 *  - PATCH /api/v1/schedules/{scheduleId}/cancel
 *
 * 시간은 모두 Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface ScheduleResponse {
  scheduleId: string;
  matchId: string;
  youthId: string;
  youthName: string;
  elderId: string;
  elderName: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: ScheduleStatus;
  cancelReason: string | null;
}

/**
 * 일정 생성 요청.
 * 백엔드 DTO: ScheduleCreateRequest
 * - 모든 필드 필수. scheduledStartAt < scheduledEndAt.
 */
export interface ScheduleCreateRequest {
  matchId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}

/**
 * 일정 취소 요청.
 * 백엔드 DTO: ScheduleCancelRequest
 * - cancelReason: optional, 최대 500자. body 자체 생략 가능.
 */
export interface ScheduleCancelRequest {
  cancelReason?: string | null;
}

// ---------- MatchTerminationRequest ----------
/**
 * 백엔드 enum: MatchTerminationRequestStatus
 */
export type MatchTerminationRequestStatus = "REQUESTED" | "APPROVED" | "REJECTED";

/**
 * 매칭 중단 요청 생성 request body.
 * 백엔드 DTO: MatchTerminationCreateRequest
 * - reason: 필수 (@NotBlank). 공백만 입력하면 백엔드에서 400 C001.
 */
export interface MatchTerminationCreateRequest {
  reason: string;
}

/**
 * 매칭 중단 요청 응답.
 * 백엔드 DTO: MatchTerminationResponse
 * 엔드포인트: POST /api/v1/matches/{matchId}/termination-requests (YOUTH/GUARDIAN)
 *
 * 주의: 응답에는 매칭 자체의 status 변화가 없음. 매칭 상태는 별도 조회 필요.
 * 동일 매칭에 REQUESTED 가 이미 있으면 MT002 (409).
 */
export interface MatchTerminationResponse {
  requestId: string;
  matchId: string;
  requesterUserId: string | null;
  reason: string;
  status: MatchTerminationRequestStatus;
  createdAt: string;
}

// ---------- ActivityRecord ----------
/**
 * 활동 기록 생성 요청.
 * 백엔드 DTO: ActivityRecordCreateRequest
 * 엔드포인트: POST /api/v1/activity-records (YOUTH)
 *
 * - matchId, scheduleId 필수.
 * - callLogId 가 있으면 백엔드가 통화 startAt/endAt 으로 durationMinutes 자동 계산.
 * - callLogId 없이 수동 입력하려면 actualStartAt/actualEndAt 또는 durationMinutes 제공.
 * - 시간은 모두 Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface ActivityRecordCreateRequest {
  matchId: string;
  scheduleId: string;
  callLogId?: string | null;
  isCompleted: boolean;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
}

/**
 * 활동 기록 생성 응답.
 * 백엔드 DTO: ActivityRecordResponse
 */
export interface ActivityRecordResponse {
  activityRecordId: string;
  durationMinutes: number | null;
  totalDurationMinutes: number;
}

/**
 * 활동 기록 목록 응답.
 * 백엔드 DTO: ActivityRecordSummaryResponse
 * 엔드포인트: GET /api/v1/activity-records (YOUTH/GUARDIAN/ADMIN)
 *
 * - YOUTH: 본인이 작성한 기록.
 * - GUARDIAN: 본인이 등록한 어르신과 연관된 기록 (youthName, notes 는 null).
 * - ADMIN: 전체 기록.
 */
export interface ActivityRecordSummaryResponse {
  activityRecordId: string;
  matchId: string;
  scheduleId: string;
  callLogId: string | null;
  youthId: string;
  youthName: string | null;
  elderId: string;
  elderName: string;
  isCompleted: boolean;
  actualStartAt: string | null;
  actualEndAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

// ---------- VolunteerStats ----------
/**
 * 청년 누적 활동 통계 응답.
 * 백엔드 DTO: YouthVolunteerStatsResponse
 * 엔드포인트: GET /api/v1/youth/volunteer-stats/me (YOUTH)
 */
export interface YouthVolunteerStatsResponse {
  youthId: string;
  totalDurationMinutes: number;
  totalHours: number;
  totalCertifiedHours: number;
  availableCertificateHours: number;
}
