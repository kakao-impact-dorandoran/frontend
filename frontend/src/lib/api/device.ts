/**
 * 전용 기기 (어르신 태블릿) Device API wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - GET /api/v1/device/main  (Authorization: Device {deviceToken})
 *
 * 모든 호출은 Device token 인증을 요구한다.
 */

import type { DeviceMainResponse } from "../../types/api";
import { apiRequest } from "./client";

export function getDeviceMain(deviceToken: string): Promise<DeviceMainResponse> {
  return apiRequest<DeviceMainResponse>("/api/v1/device/main", {
    method: "GET",
    auth: "device",
    deviceToken,
  });
}
