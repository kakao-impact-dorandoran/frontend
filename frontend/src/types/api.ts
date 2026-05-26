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
  USER_NOT_FOUND: "U002",
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
  NOT_A_YOUTH_USER: "Y005",
  INVALID_APPROVAL_STATUS: "Y006",
  REJECTION_REASON_REQUIRED: "Y007",
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
  // 통화 (Call / CallLog)
  CALL_LOG_NOT_FOUND: "CL001",
  CALL_ACCESS_DENIED: "CL002",
  CALL_ALREADY_ENDED: "CL003",
  CALL_MATCH_MISMATCH: "CL004",
  CALL_SCHEDULE_MISMATCH: "CL005",
  CALL_SCHEDULE_NOT_CONFIRMED: "CL006",
  INVALID_CALL_TYPE: "CL007",
  // 전용 기기 (Device)
  DEVICE_NOT_FOUND: "D002",
  DEVICE_AUTH_REQUIRED: "D005",
  INVALID_DEVICE_AUTHORIZATION: "D006",
  DEVICE_NOT_REGISTERED: "D007",
  // 도움 요청 (HelpRequest)
  HELP_REQUEST_NOT_FOUND: "H001",
  HELP_REQUEST_ALREADY_HANDLED: "H002",
  INVALID_HELP_REQUEST_STATUS: "H003",
  // 신고 (Report)
  REPORT_NOT_FOUND: "R001",
  INVALID_REPORT_STATUS: "R002",
  REPORT_ACCESS_DENIED: "R003",
  // 증명서 (Certificate)
  CERTIFICATE_NOT_FOUND: "CT001",
  CERTIFICATE_ACCESS_DENIED: "CT002",
  CERTIFICATE_NOT_ENOUGH_ACTIVITY_TIME: "CT003",
  CERTIFICATE_SERIAL_DUPLICATED: "CT004",
  CERTIFICATE_REQUESTED_HOURS_INVALID: "CT005",
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

// ---------- Admin: Youth Profile ----------
/**
 * 관리자 청년 승인/반려 상태 값.
 * 백엔드 enum: YouthApprovalStatus (PENDING/APPROVED/REJECTED).
 * - 관리자 API 응답은 항상 enum 값 (null 아님). 프론트 공용 YouthApprovalStatus 는 null 을 포함하므로
 *   별도 타입으로 정의한다.
 */
export type AdminYouthApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * 관리자 청년 목록 응답.
 * 백엔드 DTO: AdminYouthListResponse
 * 엔드포인트: GET /api/v1/admin/youths?approvalStatus=PENDING
 */
export interface AdminYouthListResponse {
  profileId: string;
  youthId: string;
  name: string;
  email: string;
  partnerCode: string | null;
  status: UserStatus;
  approvalStatus: AdminYouthApprovalStatus;
  rejectionReason: string | null;
  activityStatus: YouthActivityStatus;
  isCompleted: boolean;
  createdAt: string;
}

/**
 * 관리자 청년 상세 응답.
 * 백엔드 DTO: AdminYouthDetailResponse
 * 엔드포인트: GET /api/v1/admin/youths/{youthId}
 */
export interface AdminYouthDetailResponse {
  profileId: string;
  youthId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  partnerCode: string | null;
  status: UserStatus;
  profileImageUrl: string | null;
  keywords: string[] | null;
  greetingComment: string;
  voiceSampleUrl: string | null;
  approvalStatus: AdminYouthApprovalStatus;
  rejectionReason: string | null;
  activityStatus: YouthActivityStatus;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 관리자 청년 승인/반려 요청.
 * 백엔드 DTO: AdminYouthApprovalRequest
 * 엔드포인트: PATCH /api/v1/admin/youths/{youthId}/approval
 *
 * - approvalStatus: APPROVED 또는 REJECTED 만 허용. PENDING 으로 되돌리면 400 Y006.
 * - rejectionReason: REJECTED 일 때 필수 (공백/누락 시 400 Y007), 최대 500자.
 */
export interface AdminYouthApprovalRequest {
  approvalStatus: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

/**
 * 관리자 청년 승인/반려 응답.
 * 백엔드 DTO: AdminYouthApprovalResponse
 */
export interface AdminYouthApprovalResponse {
  youthId: string;
  approvalStatus: AdminYouthApprovalStatus;
  rejectionReason: string | null;
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

// ---------- Call / CallLog ----------
/**
 * 백엔드 enum: CallLogStatus
 * (PENDING = 통화 시작 직후, COMPLETED = 정상 종료, MISSED = 미응답, FAILED = 실패)
 */
export type CallLogStatus = "PENDING" | "COMPLETED" | "MISSED" | "FAILED";

/**
 * 통화 시작 요청.
 * 백엔드 DTO: CallStartRequest
 * 엔드포인트:
 *  - POST /api/v1/calls/video  (Device token 필요)
 *  - POST /api/v1/calls/audio  (Device token 필요)
 *
 * - matchId 필수 (@NotNull).
 * - scheduleId optional — 즉시 통화일 경우 null.
 */
export interface CallStartRequest {
  matchId: string;
  scheduleId?: string | null;
}

/**
 * 통화 종료 요청.
 * 백엔드 DTO: CallEndRequest
 * 엔드포인트: PATCH /api/v1/calls/{callLogId}/end (Device 또는 YOUTH JWT)
 *
 * - 모든 필드 optional. body 자체 생략 가능.
 * - failureReason: 비정상 종료 시 사유 메모 (백엔드 현 구현에서는 단순 저장만).
 */
export interface CallEndRequest {
  failureReason?: string | null;
}

/**
 * 통화 기록 응답.
 * 백엔드 DTO: CallLogResponse
 * 엔드포인트:
 *  - POST  /api/v1/calls/video, /audio  → status=PENDING, startAt 채워짐, endAt null
 *  - PATCH /api/v1/calls/{callLogId}/end → status=COMPLETED, endAt 채워짐
 *
 * - 시간은 Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface CallLogResponse {
  callLogId: string;
  matchId: string;
  scheduleId: string | null;
  callType: CallType;
  status: CallLogStatus;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
}

// ---------- Device ----------
/**
 * 백엔드 enum: DeviceStatus
 */
export type DeviceStatus = "UNREGISTERED" | "REGISTERED" | "ERROR";

/**
 * 백엔드 enum: DeviceButtonType
 */
export type DeviceButtonType = "VIDEO_CALL" | "AUDIO_CALL" | "HELP_REQUEST";

/**
 * 전용 기기 메인 화면의 오늘 일정 응답.
 * 백엔드 DTO: TodayScheduleResponse
 * - scheduledStartAt/scheduledEndAt: Asia/Seoul wall clock (LocalDateTime).
 * - 오늘 KST 확정 일정이 없으면 메인 응답에서 null.
 */
export interface DeviceTodayScheduleResponse {
  scheduleId: string;
  matchId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  callType: CallType;
  youthName: string;
}

/**
 * 전용 기기 메인 응답.
 * 백엔드 DTO: DeviceMainResponse
 * 엔드포인트: GET /api/v1/device/main
 * - Auth: Authorization: Device {deviceToken}
 * - todaySchedule 는 오늘 확정 일정이 없으면 null.
 */
export interface DeviceMainResponse {
  elderId: string;
  elderName: string;
  todaySchedule: DeviceTodayScheduleResponse | null;
  buttons: DeviceButtonType[];
  deviceStatus: DeviceStatus;
}

// ---------- HelpRequest ----------
/**
 * 백엔드 enum: HelpRequestType
 */
export type HelpRequestType = "DEVICE_HELP" | "EMERGENCY" | "ETC";

/**
 * 백엔드 enum: HelpRequestStatus
 */
export type HelpRequestStatus = "PENDING" | "HANDLED";

/**
 * 도움 요청 생성 요청.
 * 백엔드 DTO: HelpRequestCreateRequest
 * 엔드포인트: POST /api/v1/help-requests (Device token)
 *
 * - body 전체 또는 모든 필드 optional. 어르신이 버튼만 누르면 빈 body 로 생성 가능.
 * - deviceStatus: 임의 키/값 (예: battery, wifi). 현재 단순 저장만.
 */
export interface HelpRequestCreateRequest {
  requestType?: HelpRequestType | null;
  deviceStatus?: Record<string, unknown> | null;
}

/**
 * 도움 요청 생성/단건 응답.
 * 백엔드 DTO: HelpRequestResponse
 * 엔드포인트: POST /api/v1/help-requests
 *
 * - handledStatus: PENDING (생성 직후) / HANDLED (관리자 처리 완료)
 * - createdAt 은 Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface HelpRequestResponse {
  helpRequestId: string;
  elderId: string;
  deviceId: string | null;
  requestType: HelpRequestType | null;
  deviceStatus: Record<string, unknown> | null;
  handledStatus: HelpRequestStatus;
  createdAt: string;
}

// ---------- Admin: HelpRequest ----------
/**
 * 관리자 도움 요청 응답.
 * 백엔드 DTO: AdminHelpRequestResponse
 * 엔드포인트: GET /api/v1/admin/help-requests?status=PENDING
 *            PATCH /api/v1/admin/help-requests/{helpRequestId}
 */
export interface AdminHelpRequestResponse {
  helpRequestId: string;
  elderId: string;
  elderName: string;
  deviceId: string | null;
  requestType: HelpRequestType | null;
  deviceStatus: Record<string, unknown> | null;
  handledStatus: HelpRequestStatus;
  handlerId: string | null;
  handlerName: string | null;
  handledAt: string | null;
  createdAt: string;
}

/**
 * 관리자 도움 요청 처리 요청.
 * 백엔드 DTO: AdminHelpRequestProcessRequest
 * - status: HANDLED 만 허용 (그 외는 400 H003).
 * - 이미 HANDLED 인 요청 재처리 시 409 H002.
 */
export interface AdminHelpRequestProcessRequest {
  status: HelpRequestStatus;
}

// ---------- Admin: MatchTerminationRequest ----------
/**
 * 관리자 매칭 중단 요청 응답.
 * 백엔드 DTO: AdminMatchTerminationResponse
 * 엔드포인트: GET /api/v1/admin/match-termination-requests?status=REQUESTED
 *            PATCH /api/v1/admin/match-termination-requests/{requestId}
 *
 * - status=APPROVED 처리 시 백엔드가 매칭 상태를 ENDED 로 변경한다.
 * - 이미 처리된 요청은 400 MT003.
 */
export interface AdminMatchTerminationResponse {
  requestId: string;
  matchId: string;
  youthId: string;
  youthName: string;
  elderId: string;
  elderName: string;
  requesterUserId: string | null;
  requesterUserName: string | null;
  reason: string;
  status: MatchTerminationRequestStatus;
  adminId: string | null;
  adminMemo: string | null;
  createdAt: string;
  processedAt: string | null;
}

/**
 * 관리자 매칭 중단 요청 처리 요청.
 * 백엔드 DTO: AdminMatchTerminationProcessRequest
 * - status: APPROVED | REJECTED 만 허용 (REQUESTED 는 400 MT003).
 * - adminMemo: optional.
 */
export interface AdminMatchTerminationProcessRequest {
  status: MatchTerminationRequestStatus;
  adminMemo?: string | null;
}

// ---------- Report ----------
/**
 * 백엔드 enum: ReportType
 */
export type ReportType =
  | "INAPPROPRIATE_LANGUAGE"
  | "HARASSMENT"
  | "NO_SHOW"
  | "DEVICE_PROBLEM"
  | "ETC";

/**
 * 백엔드 enum: ReportStatus
 */
export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

/**
 * 신고 생성 요청.
 * 백엔드 DTO: ReportCreateRequest
 * 엔드포인트: POST /api/v1/reports (YOUTH/GUARDIAN)
 *
 * - reportType, content 는 필수 (@NotNull, @NotBlank).
 * - matchId / scheduleId / targetUserId / targetElderId 는 모두 optional 이지만
 *   매칭/일정과 연관된 신고면 함께 보내는 것이 권장됨 (백엔드에서 신고자-매칭 관계 검증).
 */
export interface ReportCreateRequest {
  matchId?: string | null;
  scheduleId?: string | null;
  targetUserId?: string | null;
  targetElderId?: string | null;
  reportType: ReportType;
  content: string;
}

/**
 * 신고 생성/단건 응답.
 * 백엔드 DTO: ReportResponse
 */
export interface ReportResponse {
  reportId: string;
  reporterUserId: string | null;
  targetUserId: string | null;
  targetElderId: string | null;
  matchId: string | null;
  scheduleId: string | null;
  reportType: ReportType;
  content: string;
  status: ReportStatus;
  createdAt: string;
}

/**
 * 관리자 신고 응답.
 * 백엔드 DTO: AdminReportResponse
 * 엔드포인트:
 *  - GET   /api/v1/admin/reports?status=PENDING
 *  - PATCH /api/v1/admin/reports/{reportId}
 */
export interface AdminReportResponse {
  reportId: string;
  reporterUserId: string | null;
  reporterUserName: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  targetElderId: string | null;
  targetElderName: string | null;
  matchId: string | null;
  scheduleId: string | null;
  reportType: ReportType;
  content: string;
  status: ReportStatus;
  adminId: string | null;
  adminMemo: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/**
 * 관리자 신고 처리 요청.
 * 백엔드 DTO: AdminReportProcessRequest
 * - status 는 PENDING 제외 (REVIEWING / RESOLVED / REJECTED).
 *   PENDING 으로 처리하면 400 R002.
 * - 이미 RESOLVED/REJECTED 인 신고를 재처리하면 400 R002.
 * - adminMemo 는 optional.
 */
export interface AdminReportProcessRequest {
  status: ReportStatus;
  adminMemo?: string | null;
}

// ---------- Certificate ----------
/**
 * 증명서 발급 요청.
 * 백엔드 DTO: CertificateIssueRequest
 * 엔드포인트: POST /api/v1/youth/certificates (YOUTH)
 *
 * - requestedHours: @NotNull, @Min(1) — 발급 신청 시간(시간 단위, 정수).
 *   백엔드 정책상 10시간 미만은 409 CT003.
 *   availableCertificateHours 보다 크면 409 CT003.
 */
export interface CertificateIssueRequest {
  requestedHours: number;
}

/**
 * 증명서 응답.
 * 백엔드 DTO: CertificateResponse
 * 엔드포인트:
 *  - POST /api/v1/youth/certificates       → 201 Created, 단건
 *  - GET  /api/v1/youth/certificates/me    → 200 OK, 배열 (issuedAt desc)
 *
 * - title: 고정 문자열 ("도란도란 사회참여 증명서").
 * - certificateSerial: "DRDR-{YYYY}-{0001}" 형식.
 * - pdfUrl: 현재 항상 null (PDF 실제 생성은 후순위).
 * - issuedAt: Asia/Seoul wall clock (LocalDateTime, 타임존 suffix 없음).
 */
export interface CertificateResponse {
  certificateId: string;
  certificateSerial: string;
  title: string;
  youthId: string;
  certifiedHours: number;
  pdfUrl: string | null;
  issuedAt: string;
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
