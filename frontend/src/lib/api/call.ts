/**
 * Call / CallLog API 호출 wrapper.
 * 백엔드 컨트롤러 매핑:
 *  - POST  /api/v1/calls/video                 : 화상 통화 시작 (Authorization: Device)
 *  - POST  /api/v1/calls/audio                 : 음성 통화 시작 (Authorization: Device)
 *  - PATCH /api/v1/calls/{callLogId}/end       : 통화 종료 (Authorization: Device 또는 Bearer YOUTH)
 *
 * 시작 API 는 전용 기기 인증(`Device {token}`)을 요구하므로 청년 화면에서는 직접 호출 불가.
 * 종료 API 만 청년 Bearer JWT 로 호출 가능 (어느 쪽이 끊든 종료 처리 허용).
 */

import type {
  CallEndRequest,
  CallLogResponse,
  CallStartRequest,
  CallType,
} from "../../types/api";
import { apiRequest } from "./client";

export function startVideoCallByDevice(
  deviceToken: string,
  body: CallStartRequest,
): Promise<CallLogResponse> {
  return apiRequest<CallLogResponse>("/api/v1/calls/video", {
    method: "POST",
    auth: "device",
    deviceToken,
    body,
  });
}

export function startAudioCallByDevice(
  deviceToken: string,
  body: CallStartRequest,
): Promise<CallLogResponse> {
  return apiRequest<CallLogResponse>("/api/v1/calls/audio", {
    method: "POST",
    auth: "device",
    deviceToken,
    body,
  });
}

export function startCallByDevice(
  deviceToken: string,
  callType: CallType,
  body: CallStartRequest,
): Promise<CallLogResponse> {
  return callType === "AUDIO"
    ? startAudioCallByDevice(deviceToken, body)
    : startVideoCallByDevice(deviceToken, body);
}

export function endCallByYouth(
  callLogId: string,
  body?: CallEndRequest,
): Promise<CallLogResponse> {
  return apiRequest<CallLogResponse>(
    `/api/v1/calls/${encodeURIComponent(callLogId)}/end`,
    {
      method: "PATCH",
      auth: "bearer",
      body: body ?? {},
    },
  );
}

export function endCallByDevice(
  deviceToken: string,
  callLogId: string,
  body?: CallEndRequest,
): Promise<CallLogResponse> {
  return apiRequest<CallLogResponse>(
    `/api/v1/calls/${encodeURIComponent(callLogId)}/end`,
    {
      method: "PATCH",
      auth: "device",
      deviceToken,
      body: body ?? {},
    },
  );
}
