/**
 * 전용 기기 (어르신 태블릿) Device token 임시 저장소.
 *
 * - sessionStorage 사용 (브라우저/탭 닫으면 사라짐).
 * - 토큰 값을 절대 console 으로 출력하지 않는다.
 * - 코드/.env 에 실제 토큰을 하드코딩하지 않는다.
 */

const DEVICE_TOKEN_KEY = "dorandoran.deviceToken";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getDeviceToken(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(DEVICE_TOKEN_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function setDeviceToken(token: string): void {
  if (!isBrowser()) return;
  const trimmed = token.trim();
  if (!trimmed) return;
  try {
    window.sessionStorage.setItem(DEVICE_TOKEN_KEY, trimmed);
  } catch {
    void 0;
  }
}

export function clearDeviceToken(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    void 0;
  }
}
