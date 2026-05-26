/**
 * 로컬 시연용 seed 계정 (백엔드 DataInitializer 가 생성).
 *
 * 보안 주의:
 * - 모두 백엔드 `/api/v1/auth/login` 흐름을 그대로 탄다. 프론트 단독 데모 토큰을 사용하지 않는다.
 * - `test1234!` 는 운영용 비밀번호가 아니라 로컬 seed 비밀번호이며, 입력 편의용으로만 사용한다.
 * - 운영/스테이징에는 seed 계정이 존재하지 않으므로 노출 여부는 `VITE_SHOW_DEMO_ACCOUNTS` 로 제어한다.
 */
import type { UserRole } from "../../types/api";

export const SEED_ACCOUNT_PASSWORD = "test1234!";

export type SeedAccountVariant =
  | "youth-approved"
  | "youth-default"
  | "youth-pending"
  | "youth-rejected"
  | "youth-banned"
  | "guardian"
  | "admin";

export interface SeedAccountDefinition {
  email: string;
  label: string;
  description: string;
  role: UserRole;
  variant: SeedAccountVariant;
}

/**
 * 로그인 화면 시연 카드에 노출할 백엔드 seed 계정 목록.
 *
 * 모두 백엔드 로그인 API 를 호출한다. 프론트 단독 데모 토큰을 사용하지 않는다.
 */
export const SEED_ACCOUNTS: SeedAccountDefinition[] = [
  {
    email: "youth_approved@test.com",
    label: "승인 완료 청년",
    description: "관리자 승인이 완료된 청년 계정. /youth 진입.",
    role: "YOUTH",
    variant: "youth-approved",
  },
  {
    email: "guardian@test.com",
    label: "보호자",
    description: "보호자 대시보드 / 어르신 관리.",
    role: "GUARDIAN",
    variant: "guardian",
  },
  {
    email: "admin@test.com",
    label: "관리자",
    description: "관리자 운영 / 승인·제재.",
    role: "ADMIN",
    variant: "admin",
  },
  {
    email: "youth@test.com",
    label: "일반 청년",
    description: "기본 청년 계정.",
    role: "YOUTH",
    variant: "youth-default",
  },
  {
    email: "youth_pending@test.com",
    label: "승인 대기 청년",
    description: "관리자 승인 대기 상태. 로그인 시 안내 팝업.",
    role: "YOUTH",
    variant: "youth-pending",
  },
  {
    email: "youth_rejected@test.com",
    label: "반려 청년",
    description: "프로필 반려 상태. 로그인 시 안내 팝업.",
    role: "YOUTH",
    variant: "youth-rejected",
  },
  {
    email: "youth_banned@test.com",
    label: "제재 청년",
    description: "이용 제한(제재) 상태. 로그인 시 안내 팝업.",
    role: "YOUTH",
    variant: "youth-banned",
  },
];
