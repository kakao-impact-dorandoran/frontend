/**
 * 프론트 단독 시연(데모) 로그인 모드.
 *
 * 보안 주의: 이 모듈은 실제 인증을 대체하지 않는다.
 * - VITE_ENABLE_DEMO_LOGIN === "true" 일 때만 활성화 (기본 false).
 * - token 은 실제 JWT 와 구분되도록 "demo-token-" prefix 사용.
 * - 비밀번호/실제 토큰을 코드나 .env.example 에 두지 않는다.
 */

import type { AuthUserResponse } from "../../types/api";

export const DEMO_LOGIN_ENABLED =
  import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

export const DEMO_TOKEN_PREFIX = "demo-token-";

export function isDemoToken(token: string | null | undefined): boolean {
  return typeof token === "string" && token.startsWith(DEMO_TOKEN_PREFIX);
}

export type DemoLoginDialog = "pending" | "rejected" | "suspended";

export interface DemoAccountDefinition {
  email: string;
  label: string;
  description: string;
  user: AuthUserResponse | null;
  redirectTo?: string;
  loginDialog?: DemoLoginDialog;
  rejectionReason?: string;
}

function demoUser(
  overrides: Partial<AuthUserResponse> &
    Pick<AuthUserResponse, "id" | "email" | "name" | "role">,
): AuthUserResponse {
  return {
    profileUrl: null,
    status: "ACTIVE",
    partnerCode: null,
    approvalStatus: null,
    rejectionReason: null,
    activityStatus: null,
    ...overrides,
  };
}

export const DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  {
    email: "youth@demo.com",
    label: "청년",
    description: "승인 완료 청년. 대시보드/매칭/일정/통화 데모용.",
    user: demoUser({
      id: "demo-youth-1",
      email: "youth@demo.com",
      name: "청년 데모",
      role: "YOUTH",
      approvalStatus: "APPROVED",
      activityStatus: "AVAILABLE",
    }),
  },
  {
    email: "guardian@demo.com",
    label: "보호자",
    description: "보호자 대시보드 / 어르신 관리 데모용.",
    user: demoUser({
      id: "demo-guardian-1",
      email: "guardian@demo.com",
      name: "보호자 데모",
      role: "GUARDIAN",
    }),
  },
  {
    email: "admin@demo.com",
    label: "관리자",
    description: "관리자 운영 / 승인·제재 데모용.",
    user: demoUser({
      id: "demo-admin-1",
      email: "admin@demo.com",
      name: "관리자 데모",
      role: "ADMIN",
    }),
  },
  {
    email: "senior@demo.com",
    label: "어르신(태블릿)",
    description: "어르신 전용 기기 화면 shortcut. Device 인증은 /senior 에서.",
    user: null,
    redirectTo: "/senior",
  },
  {
    email: "pending@demo.com",
    label: "승인대기",
    description: "관리자 승인 대기 팝업 흐름.",
    user: demoUser({
      id: "demo-pending-1",
      email: "pending@demo.com",
      name: "승인대기 데모",
      role: "YOUTH",
      approvalStatus: "PENDING",
    }),
    loginDialog: "pending",
  },
  {
    email: "rejected@demo.com",
    label: "반려",
    description: "프로필 반려 안내 팝업 흐름.",
    user: demoUser({
      id: "demo-rejected-1",
      email: "rejected@demo.com",
      name: "반려 데모",
      role: "YOUTH",
      approvalStatus: "REJECTED",
      rejectionReason: "시연용 반려 사유입니다.",
    }),
    loginDialog: "rejected",
    rejectionReason: "시연용 반려 사유입니다.",
  },
  {
    email: "suspended@demo.com",
    label: "제재",
    description: "이용 제한(제재) 안내 팝업 흐름.",
    user: demoUser({
      id: "demo-suspended-1",
      email: "suspended@demo.com",
      name: "제재 데모",
      role: "YOUTH",
      status: "SUSPENDED",
      approvalStatus: "APPROVED",
    }),
    loginDialog: "suspended",
  },
];

export function findDemoAccount(email: string): DemoAccountDefinition | null {
  const normalized = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.email === normalized) ?? null;
}

export function buildDemoToken(email: string): string {
  const localPart = email.split("@")[0] ?? "user";
  return `${DEMO_TOKEN_PREFIX}${localPart}`;
}
