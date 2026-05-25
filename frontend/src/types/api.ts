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
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
