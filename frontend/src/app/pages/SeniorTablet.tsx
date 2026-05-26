import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Video,
  Phone,
  HelpCircle,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  User,
  Heart,
  Clock,
  KeyRound,
  Loader2,
  RefreshCw,
  Copy,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../lib/api/client";
import {
  endCallByDevice,
  startCallByDevice,
} from "../../lib/api/call";
import { getDeviceMain } from "../../lib/api/device";
import { createHelpRequestByDevice } from "../../lib/api/helpRequest";
import {
  clearDeviceToken,
  getDeviceToken,
  setDeviceToken,
} from "../../lib/device/token";
import type {
  CallLogResponse,
  CallType,
  DeviceMainResponse,
  HelpRequestResponse,
  HelpRequestType,
} from "../../types/api";
import { ErrorCode } from "../../types/api";

type CallScreenType = "VIDEO" | "AUDIO";
type CallPhase = "starting" | "in_call" | "ending" | "ended";

interface ActiveCall {
  phase: CallPhase;
  callType: CallScreenType;
  callLog: CallLogResponse;
  seconds: number;
}

type Screen =
  | { type: "home" }
  | { type: "call"; data: ActiveCall };

const HELP_REQUEST_TYPE_OPTIONS: Array<{
  value: HelpRequestType;
  label: string;
  description: string;
}> = [
  {
    value: "DEVICE_HELP",
    label: "기기 사용이 어려워요",
    description: "버튼/화면이 잘 보이지 않거나 조작이 어려운 경우",
  },
  {
    value: "EMERGENCY",
    label: "긴급 도움이 필요해요",
    description: "몸이 불편하거나 위급한 상황",
  },
  {
    value: "ETC",
    label: "기타 문의",
    description: "그 밖의 도움이 필요한 경우",
  },
];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

function formatStartAt(value: string | null): string {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 19);
}

function resolveDeviceError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.DEVICE_AUTH_REQUIRED:
        return "기기 토큰이 없습니다. 토큰을 입력해 주세요.";
      case ErrorCode.INVALID_DEVICE_AUTHORIZATION:
        return "기기 토큰 형식이 올바르지 않습니다.";
      case ErrorCode.DEVICE_NOT_REGISTERED:
        return "이 기기는 현재 사용할 수 없습니다. 관리자에게 문의해 주세요.";
      case ErrorCode.DEVICE_NOT_FOUND:
        return "등록되지 않은 기기 토큰입니다. 다시 입력해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "기기 인증에 실패했습니다. 토큰을 다시 입력해 주세요.";
    if (err.status === 403) return "이 기기는 현재 사용할 수 없습니다.";
    if (err.status === 404) return "기기 정보를 찾을 수 없습니다.";
    return err.message || "기기 정보를 불러오지 못했습니다.";
  }
  return "기기 정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveStartCallError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.DEVICE_AUTH_REQUIRED:
      case ErrorCode.INVALID_DEVICE_AUTHORIZATION:
      case ErrorCode.DEVICE_NOT_FOUND:
        return "기기 인증이 만료되었습니다. 토큰을 다시 입력해 주세요.";
      case ErrorCode.DEVICE_NOT_REGISTERED:
        return "이 기기는 현재 사용할 수 없습니다.";
      case ErrorCode.MATCH_NOT_FOUND:
        return "매칭 정보를 찾을 수 없습니다.";
      case ErrorCode.MATCH_ACCESS_DENIED:
        return "이 매칭으로 통화를 시작할 권한이 없습니다.";
      case ErrorCode.CALL_MATCH_MISMATCH:
        return "매칭 정보가 일치하지 않습니다.";
      case ErrorCode.CALL_SCHEDULE_MISMATCH:
        return "일정 정보가 일치하지 않습니다.";
      case ErrorCode.CALL_SCHEDULE_NOT_CONFIRMED:
        return "확정된 일정에서만 통화를 시작할 수 있습니다.";
      case ErrorCode.INVALID_CALL_TYPE:
        return "잘못된 통화 유형입니다.";
      case ErrorCode.INVALID_INPUT:
        return err.message || "통화 시작 정보가 올바르지 않습니다.";
      default:
        break;
    }
    if (err.status === 404) return "매칭 또는 일정 정보를 찾을 수 없습니다.";
    if (err.status === 500) return "잠시 후 다시 시도해 주세요.";
    return err.message || "통화를 시작하지 못했습니다.";
  }
  return "통화를 시작하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveHelpRequestError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.DEVICE_AUTH_REQUIRED:
      case ErrorCode.INVALID_DEVICE_AUTHORIZATION:
      case ErrorCode.DEVICE_NOT_FOUND:
        return "기기 인증이 만료되었습니다. 토큰을 다시 입력해 주세요.";
      case ErrorCode.DEVICE_NOT_REGISTERED:
        return "이 기기는 현재 사용할 수 없습니다.";
      case ErrorCode.INVALID_INPUT:
        return err.message || "도움 요청 정보가 올바르지 않습니다.";
      default:
        break;
    }
    if (err.status === 401) return "기기 인증에 실패했습니다. 토큰을 다시 입력해 주세요.";
    if (err.status === 403) return "이 기기는 현재 사용할 수 없습니다.";
    if (err.status === 500) return "잠시 후 다시 시도해 주세요.";
    return err.message || "도움 요청을 접수하지 못했습니다.";
  }
  return "도움 요청을 접수하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveEndCallError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.CALL_ALREADY_ENDED:
        return "이미 종료된 통화입니다.";
      case ErrorCode.CALL_LOG_NOT_FOUND:
        return "통화 기록을 찾을 수 없습니다.";
      case ErrorCode.CALL_ACCESS_DENIED:
        return "이 통화를 종료할 권한이 없습니다.";
      case ErrorCode.DEVICE_AUTH_REQUIRED:
      case ErrorCode.INVALID_DEVICE_AUTHORIZATION:
      case ErrorCode.DEVICE_NOT_FOUND:
      case ErrorCode.DEVICE_NOT_REGISTERED:
        return "기기 인증이 만료되었습니다. 토큰을 다시 입력해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "기기 인증에 실패했습니다.";
    if (err.status === 403) return "이 통화를 종료할 권한이 없습니다.";
    if (err.status === 404) return "통화 기록을 찾을 수 없습니다.";
    return err.message || "통화를 종료하지 못했습니다.";
  }
  return "통화를 종료하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function buildYouthCallUrl(
  log: CallLogResponse,
  callType: CallScreenType,
  seniorName: string,
): string {
  const params = new URLSearchParams();
  params.set("callLogId", log.callLogId);
  params.set("matchId", log.matchId);
  if (log.scheduleId) params.set("scheduleId", log.scheduleId);
  params.set("type", callType === "VIDEO" ? "video" : "voice");
  if (seniorName) params.set("senior", seniorName);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/youth/call?${params.toString()}`;
}

export default function SeniorTablet() {
  const [searchParams] = useSearchParams();
  const queryMatchId = searchParams.get("matchId");
  const queryScheduleId = searchParams.get("scheduleId");

  const [deviceTokenState, setDeviceTokenState] = useState<string | null>(() =>
    getDeviceToken(),
  );
  const [tokenInput, setTokenInput] = useState("");
  const [deviceMain, setDeviceMain] = useState<DeviceMainResponse | null>(null);
  const [deviceMainLoading, setDeviceMainLoading] = useState(false);
  const [deviceMainError, setDeviceMainError] = useState<string | null>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);

  const [manualMatchId, setManualMatchId] = useState(queryMatchId ?? "");
  const [manualScheduleId, setManualScheduleId] = useState(queryScheduleId ?? "");

  const [screen, setScreen] = useState<Screen>({ type: "home" });
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const activeCallLogIdRef = useRef<string | null>(null);

  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpRequestType, setHelpRequestType] = useState<HelpRequestType>(
    "DEVICE_HELP",
  );
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [lastHelpRequest, setLastHelpRequest] =
    useState<HelpRequestResponse | null>(null);
  const helpInFlightRef = useRef(false);

  const hasToken = Boolean(deviceTokenState);

  const fetchDeviceMain = useCallback(async (token: string) => {
    setDeviceMainLoading(true);
    setDeviceMainError(null);
    try {
      const main = await getDeviceMain(token);
      setDeviceMain(main);
    } catch (err) {
      const message = resolveDeviceError(err);
      setDeviceMain(null);
      setDeviceMainError(message);
      if (err instanceof ApiError) {
        if (
          err.code === ErrorCode.DEVICE_AUTH_REQUIRED ||
          err.code === ErrorCode.INVALID_DEVICE_AUTHORIZATION ||
          err.code === ErrorCode.DEVICE_NOT_FOUND
        ) {
          clearDeviceToken();
          setDeviceTokenState(null);
          setShowTokenForm(true);
        }
      }
      toast.error(message);
    } finally {
      setDeviceMainLoading(false);
    }
  }, []);

  useEffect(() => {
    if (deviceTokenState) {
      void fetchDeviceMain(deviceTokenState);
    }
  }, [deviceTokenState, fetchDeviceMain]);

  const seniorName = deviceMain?.elderName ?? "어르신";
  const youthName = deviceMain?.todaySchedule?.youthName ?? "청년";

  const effectiveMatchId = useMemo(() => {
    const fromMain = deviceMain?.todaySchedule?.matchId;
    const fromManual = manualMatchId.trim();
    return fromMain || fromManual || "";
  }, [deviceMain, manualMatchId]);

  const effectiveScheduleId = useMemo(() => {
    const fromMain = deviceMain?.todaySchedule?.scheduleId ?? "";
    const fromManual = manualScheduleId.trim();
    return fromMain || fromManual;
  }, [deviceMain, manualScheduleId]);

  useEffect(() => {
    if (screen.type !== "call") return;
    if (screen.data.phase !== "in_call") return;
    const interval = setInterval(() => {
      setScreen((prev) => {
        if (prev.type !== "call" || prev.data.phase !== "in_call") return prev;
        return { ...prev, data: { ...prev.data, seconds: prev.data.seconds + 1 } };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen.type, screen.type === "call" ? screen.data.phase : null]);

  const handleSaveToken = useCallback(() => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      toast.error("기기 토큰을 입력해 주세요.");
      return;
    }
    setDeviceToken(trimmed);
    setDeviceTokenState(trimmed);
    setTokenInput("");
    setShowTokenForm(false);
    toast.success("기기 토큰이 등록되었습니다.");
  }, [tokenInput]);

  const handleClearToken = useCallback(() => {
    clearDeviceToken();
    setDeviceTokenState(null);
    setDeviceMain(null);
    setDeviceMainError(null);
    setShowTokenForm(true);
    setLastHelpRequest(null);
    toast.info("기기 토큰을 삭제했습니다.");
  }, []);

  const handleRefreshMain = useCallback(() => {
    if (!deviceTokenState) return;
    void fetchDeviceMain(deviceTokenState);
  }, [deviceTokenState, fetchDeviceMain]);

  const startCall = useCallback(
    async (callType: CallScreenType) => {
      if (!deviceTokenState) {
        toast.error("기기 토큰을 먼저 등록해 주세요.");
        setShowTokenForm(true);
        return;
      }
      if (!effectiveMatchId) {
        toast.error("통화를 시작할 매칭 정보를 찾을 수 없습니다.");
        return;
      }
      if (activeCallLogIdRef.current) {
        toast.error("이미 진행 중인 통화가 있습니다.");
        return;
      }
      if (screen.type === "call") {
        toast.error("이미 진행 중인 통화가 있습니다.");
        return;
      }

      const placeholder: ActiveCall = {
        phase: "starting",
        callType,
        callLog: {
          callLogId: "",
          matchId: effectiveMatchId,
          scheduleId: effectiveScheduleId || null,
          callType,
          status: "PENDING",
          startAt: null,
          endAt: null,
          createdAt: "",
        },
        seconds: 0,
      };
      setScreen({ type: "call", data: placeholder });

      try {
        const log = await startCallByDevice(deviceTokenState, callType, {
          matchId: effectiveMatchId,
          scheduleId: effectiveScheduleId || null,
        });
        activeCallLogIdRef.current = log.callLogId;
        setScreen({
          type: "call",
          data: {
            phase: "in_call",
            callType,
            callLog: log,
            seconds: 0,
          },
        });
        toast.success(
          callType === "VIDEO"
            ? "화상 통화를 시작했습니다."
            : "음성 통화를 시작했습니다.",
        );
      } catch (err) {
        toast.error(resolveStartCallError(err));
        setScreen({ type: "home" });
      }
    },
    [deviceTokenState, effectiveMatchId, effectiveScheduleId, screen.type],
  );

  const openHelpDialog = useCallback(() => {
    if (!deviceTokenState) {
      toast.error("기기 토큰을 먼저 등록해 주세요.");
      setShowTokenForm(true);
      return;
    }
    setHelpRequestType("DEVICE_HELP");
    setHelpDialogOpen(true);
  }, [deviceTokenState]);

  const submitHelpRequest = useCallback(async () => {
    if (!deviceTokenState) {
      toast.error("기기 토큰을 먼저 등록해 주세요.");
      setShowTokenForm(true);
      setHelpDialogOpen(false);
      return;
    }
    if (helpInFlightRef.current) return;
    helpInFlightRef.current = true;
    setHelpSubmitting(true);
    try {
      const response = await createHelpRequestByDevice(deviceTokenState, {
        requestType: helpRequestType,
      });
      setLastHelpRequest(response);
      setHelpDialogOpen(false);
      toast.success("도움 요청이 접수되었습니다. 곧 연락드릴게요.");
    } catch (err) {
      const message = resolveHelpRequestError(err);
      if (err instanceof ApiError) {
        if (
          err.code === ErrorCode.DEVICE_AUTH_REQUIRED ||
          err.code === ErrorCode.INVALID_DEVICE_AUTHORIZATION ||
          err.code === ErrorCode.DEVICE_NOT_FOUND
        ) {
          clearDeviceToken();
          setDeviceTokenState(null);
          setShowTokenForm(true);
          setHelpDialogOpen(false);
        }
      }
      toast.error(message);
    } finally {
      helpInFlightRef.current = false;
      setHelpSubmitting(false);
    }
  }, [deviceTokenState, helpRequestType]);

  const handleEndCall = useCallback(async () => {
    if (screen.type !== "call") {
      setScreen({ type: "home" });
      setMuted(false);
      setCameraOff(false);
      return;
    }
    const data = screen.data;

    if (data.phase === "ended") {
      setScreen({ type: "home" });
      setMuted(false);
      setCameraOff(false);
      return;
    }

    if (data.phase === "starting" || !data.callLog.callLogId) {
      setScreen({ type: "home" });
      setMuted(false);
      setCameraOff(false);
      return;
    }

    if (!deviceTokenState) {
      toast.error("기기 토큰이 없어 통화를 종료할 수 없습니다.");
      return;
    }

    if (data.phase === "ending") return;

    setScreen({ type: "call", data: { ...data, phase: "ending" } });

    try {
      const ended = await endCallByDevice(
        deviceTokenState,
        data.callLog.callLogId,
      );
      activeCallLogIdRef.current = null;
      setScreen({
        type: "call",
        data: {
          phase: "ended",
          callType: data.callType,
          callLog: ended,
          seconds: data.seconds,
        },
      });
      toast.success(`통화가 종료되었습니다 · ${formatTime(data.seconds)}`);
    } catch (err) {
      setScreen({ type: "call", data: { ...data, phase: "in_call" } });
      if (
        err instanceof ApiError &&
        err.code === ErrorCode.CALL_ALREADY_ENDED
      ) {
        activeCallLogIdRef.current = null;
        setScreen({
          type: "call",
          data: { ...data, phase: "ended" },
        });
      }
      toast.error(resolveEndCallError(err));
    }
  }, [deviceTokenState, screen]);

  const handleReturnHome = useCallback(() => {
    setScreen({ type: "home" });
    setMuted(false);
    setCameraOff(false);
    activeCallLogIdRef.current = null;
  }, []);

  const handleCopyYouthUrl = useCallback(
    async (log: CallLogResponse, callType: CallScreenType) => {
      const url = buildYouthCallUrl(log, callType, seniorName);
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          toast.success("청년 접속 링크가 복사되었습니다.");
        } else {
          toast.info("링크 복사가 지원되지 않는 환경입니다.");
        }
      } catch {
        toast.error("링크 복사에 실패했습니다.");
      }
    },
    [seniorName],
  );

  if (screen.type === "call") {
    const { data } = screen;
    const isVideo = data.callType === "VIDEO";
    const isStarting = data.phase === "starting";
    const isEnding = data.phase === "ending";
    const isEnded = data.phase === "ended";
    const youthCallUrl =
      data.callLog.callLogId
        ? buildYouthCallUrl(data.callLog, data.callType, seniorName)
        : "";

    if (isVideo) {
      return (
        <div
          className="min-h-screen bg-gray-900 flex flex-col text-white"
          style={{ fontFamily: "Pretendard, sans-serif" }}
        >
          <div className="flex-1 relative">
            {!cameraOff ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-400" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
                  <VideoOff className="w-24 h-24 text-gray-400" />
                </div>
              </div>
            )}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/50 px-8 py-4 rounded-full text-center">
              <p className="text-3xl font-bold">{youthName} 청년</p>
              <p className="text-xl mt-1">
                {isStarting
                  ? "통화 연결 중..."
                  : isEnded
                  ? "통화 종료됨"
                  : formatTime(data.seconds)}
              </p>
            </div>
            <div className="absolute bottom-8 right-8 w-40 h-56 bg-gray-700 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center">
              <p className="text-lg">내 모습</p>
            </div>

            {data.callLog.callLogId && (
              <div className="absolute top-32 left-4 right-4 mx-auto max-w-xl bg-black/60 rounded-2xl p-4 text-sm space-y-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-gray-400">callLogId</span>
                  <span className="font-mono break-all">{data.callLog.callLogId}</span>
                  <span className="text-gray-400">matchId</span>
                  <span className="font-mono break-all">{data.callLog.matchId}</span>
                  <span className="text-gray-400">scheduleId</span>
                  <span className="font-mono break-all">
                    {data.callLog.scheduleId ?? "(즉시 통화)"}
                  </span>
                  <span className="text-gray-400">callType</span>
                  <span>{data.callLog.callType}</span>
                  <span className="text-gray-400">startedAt</span>
                  <span>{formatStartAt(data.callLog.startAt)}</span>
                  {isEnded && (
                    <>
                      <span className="text-gray-400">endedAt</span>
                      <span>{formatStartAt(data.callLog.endAt)}</span>
                      <span className="text-gray-400">status</span>
                      <span>{data.callLog.status}</span>
                    </>
                  )}
                </div>
                {youthCallUrl && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                    <p className="flex-1 truncate text-xs text-gray-300">
                      {youthCallUrl}
                    </p>
                    <Button
                      onClick={() => void handleCopyYouthUrl(data.callLog, data.callType)}
                      className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      링크 복사
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="bg-black/80 p-8 flex justify-center gap-6">
            <Button
              onClick={() => setMuted((m) => !m)}
              disabled={isEnded || isStarting}
              className={`w-24 h-24 rounded-full ${muted ? "bg-gray-600" : "bg-gray-700"} hover:bg-gray-600 disabled:opacity-50`}
            >
              {muted ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </Button>
            <Button
              onClick={() => setCameraOff((c) => !c)}
              disabled={isEnded || isStarting}
              className={`w-24 h-24 rounded-full ${cameraOff ? "bg-gray-600" : "bg-gray-700"} hover:bg-gray-600 disabled:opacity-50`}
            >
              {cameraOff ? <VideoOff className="w-10 h-10" /> : <Video className="w-10 h-10" />}
            </Button>
            {isEnded ? (
              <Button
                onClick={handleReturnHome}
                className="w-40 h-24 rounded-full bg-gray-700 hover:bg-gray-600"
              >
                <span className="text-2xl font-bold">홈으로</span>
              </Button>
            ) : (
              <Button
                onClick={() => void handleEndCall()}
                disabled={isEnding}
                className="w-32 h-24 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-70"
              >
                {isEnding ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <PhoneOff className="w-10 h-10 mr-2" />
                )}
                <span className="text-2xl font-bold">
                  {isEnding ? "종료 중" : "끊기"}
                </span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-between p-12"
        style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}
      >
        <div className="w-full flex justify-center pt-4">
          <span className="text-2xl text-gray-400 tracking-widest">
            {isStarting ? "통화 연결 중..." : isEnded ? "통화 종료됨" : "통화 중"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            {data.phase === "in_call" && (
              <>
                <div
                  className="absolute w-80 h-80 rounded-full opacity-10"
                  style={{
                    backgroundColor: "#FF8A3D",
                    animation: "ping 3.6s cubic-bezier(0,0,0.2,1) infinite",
                  }}
                />
                <div
                  className="absolute w-72 h-72 rounded-full opacity-20"
                  style={{
                    backgroundColor: "#FF8A3D",
                    animation: "ping 3.6s cubic-bezier(0,0,0.2,1) infinite",
                    animationDelay: "1.2s",
                  }}
                />
              </>
            )}
            <div
              className="w-64 h-64 rounded-full flex items-center justify-center shadow-2xl relative z-10"
              style={{ backgroundColor: "#FFE8D6" }}
            >
              <User className="w-32 h-32" style={{ color: "#FF8A3D" }} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900">{youthName} 청년</h2>
            <p className="text-3xl mt-3" style={{ color: "#FF8A3D" }}>
              {isStarting
                ? "🔔 통화 연결 중..."
                : isEnded
                ? "통화 종료됨"
                : formatTime(data.seconds)}
            </p>
          </div>

          {data.phase === "in_call" && (
            <div className="flex items-end gap-2 h-12">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-3 rounded-full animate-pulse"
                  style={{
                    height: `${16 + (i % 4) * 12}px`,
                    backgroundColor: "#FF8A3D",
                    opacity: 0.7,
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}

          {data.callLog.callLogId && (
            <div className="w-full max-w-xl bg-white rounded-2xl border p-5 text-sm text-gray-700 space-y-2 shadow-sm">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <span className="text-gray-500">callLogId</span>
                <span className="font-mono break-all text-gray-800">
                  {data.callLog.callLogId}
                </span>
                <span className="text-gray-500">matchId</span>
                <span className="font-mono break-all text-gray-800">
                  {data.callLog.matchId}
                </span>
                <span className="text-gray-500">scheduleId</span>
                <span className="font-mono break-all text-gray-800">
                  {data.callLog.scheduleId ?? "(즉시 통화)"}
                </span>
                <span className="text-gray-500">callType</span>
                <span>{data.callLog.callType}</span>
                <span className="text-gray-500">startedAt</span>
                <span>{formatStartAt(data.callLog.startAt)}</span>
                {isEnded && (
                  <>
                    <span className="text-gray-500">endedAt</span>
                    <span>{formatStartAt(data.callLog.endAt)}</span>
                    <span className="text-gray-500">status</span>
                    <span>{data.callLog.status}</span>
                  </>
                )}
              </div>
              {youthCallUrl && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <p className="flex-1 truncate text-xs text-gray-500">
                    {youthCallUrl}
                  </p>
                  <Button
                    onClick={() => void handleCopyYouthUrl(data.callLog, data.callType)}
                    className="h-9 px-3"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    링크 복사
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-10 items-center">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setMuted((m) => !m)}
              disabled={isEnded || isStarting}
              className="w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-md disabled:opacity-50"
              style={{
                backgroundColor: muted ? "#e5e7eb" : "#fff",
                border: "2px solid #e5e7eb",
              }}
            >
              {muted ? (
                <MicOff className="w-14 h-14 text-gray-500" />
              ) : (
                <Mic className="w-14 h-14 text-gray-600" />
              )}
            </button>
            <span className="text-xl text-gray-500">
              {muted ? "음소거 중" : "마이크"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            {isEnded ? (
              <button
                onClick={handleReturnHome}
                className="w-36 h-36 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 bg-gray-700 text-white"
              >
                <span className="text-2xl font-bold">홈으로</span>
              </button>
            ) : (
              <button
                onClick={() => void handleEndCall()}
                disabled={isEnding}
                className="w-36 h-36 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 disabled:opacity-70"
                style={{ backgroundColor: "#FF4444" }}
              >
                {isEnding ? (
                  <Loader2 className="w-14 h-14 text-white animate-spin" />
                ) : (
                  <PhoneOff className="w-14 h-14 text-white" />
                )}
              </button>
            )}
            <span className="text-2xl font-bold text-gray-700">
              {isEnded ? "통화 종료" : isEnding ? "종료 중..." : "끊기"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const showTokenCard = !hasToken || showTokenForm;
  const todaySchedule = deviceMain?.todaySchedule ?? null;
  const startDisabled =
    !hasToken || deviceMainLoading || !effectiveMatchId || Boolean(activeCallLogIdRef.current);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#F0EDE8" }}
    >
      <div
        className="w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1E1E2E", padding: "6px" }}
      >
        <div
          className="rounded-[2.6rem] overflow-hidden"
          style={{ backgroundColor: "#FAF8F5" }}
        >
          <div className="flex items-center justify-between px-10 pt-9 pb-5">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8" style={{ color: "#FF8A3D" }} />
              <span className="text-3xl font-bold text-gray-900">도란도란</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-700">
                {seniorName} 어르신
              </span>
              <span className="text-2xl">👋</span>
            </div>
          </div>

          <div className="px-10 pb-3">
            <p className="text-2xl text-gray-600">
              오늘도 따뜻한 하루 되세요 😊
            </p>
          </div>

          <div className="px-10 pb-5 flex items-center gap-3 flex-wrap">
            {hasToken ? (
              <>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-base">
                  <KeyRound className="w-4 h-4" />
                  기기 토큰 등록됨
                </span>
                <Button
                  onClick={handleRefreshMain}
                  disabled={deviceMainLoading}
                  className="h-10 px-4 bg-white text-gray-700 border hover:bg-gray-50 disabled:opacity-60"
                >
                  {deviceMainLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  새로고침
                </Button>
                <Button
                  onClick={() => setShowTokenForm((v) => !v)}
                  className="h-10 px-4 bg-white text-gray-700 border hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  기기 토큰 변경
                </Button>
                <Button
                  onClick={handleClearToken}
                  className="h-10 px-4 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                >
                  토큰 삭제
                </Button>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-base">
                <KeyRound className="w-4 h-4" />
                기기 토큰 미등록
              </span>
            )}
          </div>

          {showTokenCard && (
            <div className="px-10 pb-5">
              <div
                className="rounded-2xl p-5 border space-y-3"
                style={{ backgroundColor: "#FFFBF4", borderColor: "#FFE2C2" }}
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" style={{ color: "#FF8A3D" }} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    기기 토큰 입력
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  운영자에게 전달받은 기기 토큰을 입력해 주세요. 토큰은 이 탭이
                  닫힐 때까지 임시로 저장됩니다.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder="Device token"
                    autoComplete="off"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveToken();
                    }}
                    className="h-11"
                  />
                  <Button
                    onClick={handleSaveToken}
                    className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    저장
                  </Button>
                  {hasToken && (
                    <Button
                      onClick={() => {
                        setShowTokenForm(false);
                        setTokenInput("");
                      }}
                      className="h-11 px-4 bg-white text-gray-700 border hover:bg-gray-50"
                    >
                      취소
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {deviceMainError && (
            <div className="px-10 pb-5">
              <div className="rounded-2xl px-5 py-4 border border-red-200 bg-red-50 text-red-700 text-sm">
                {deviceMainError}
              </div>
            </div>
          )}

          {hasToken && (
            <div className="px-10 pb-6">
              <div
                className="flex items-center gap-4 rounded-2xl px-6 py-4"
                style={{ backgroundColor: "#FFF4E6" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#FFE8D6" }}
                >
                  <Clock className="w-5 h-5" style={{ color: "#FF8A3D" }} />
                </div>
                <div className="flex-1">
                  {deviceMainLoading ? (
                    <p className="text-lg text-gray-500 inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      기기 정보를 불러오는 중...
                    </p>
                  ) : todaySchedule ? (
                    <>
                      <p className="text-xl font-semibold text-gray-800">
                        오늘 {todaySchedule.youthName} 청년과 통화 예정
                      </p>
                      <p className="text-base text-gray-500">
                        {todaySchedule.scheduledStartAt.replace("T", " ").slice(11, 16)}
                        {" ~ "}
                        {todaySchedule.scheduledEndAt.replace("T", " ").slice(11, 16)}
                        {" · "}
                        {todaySchedule.callType === "VIDEO" ? "화상" : "음성"}{" "}
                        통화
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-600">
                      오늘 확정된 통화 일정이 없어요. 즉시 통화로 연결할 수
                      있어요.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasToken && !todaySchedule && (
            <div className="px-10 pb-6 space-y-2">
              <p className="text-sm text-gray-500">
                매칭/일정 ID 를 직접 입력해 즉시 통화를 시작할 수 있어요
                (예: ?matchId=...&amp;scheduleId=... 로 진입 가능).
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="matchId (필수, UUID)"
                  value={manualMatchId}
                  onChange={(e) => setManualMatchId(e.target.value)}
                  className="h-10 font-mono text-sm"
                />
                <Input
                  placeholder="scheduleId (선택)"
                  value={manualScheduleId}
                  onChange={(e) => setManualScheduleId(e.target.value)}
                  className="h-10 font-mono text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-5 px-10 pb-10">
            <button
              onClick={() => void startCall("VIDEO")}
              disabled={startDisabled}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFE8D6" }}
              >
                <Video className="w-14 h-14" style={{ color: "#FF8A3D" }} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  얼굴 보며
                  <br />
                  전화하기
                </h3>
                <p className="text-lg text-gray-500">화상 통화</p>
              </div>
            </button>

            <button
              onClick={() => void startCall("AUDIO")}
              disabled={startDisabled}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#D4EDE4" }}
              >
                <Phone className="w-14 h-14" style={{ color: "#3DAF8A" }} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  목소리만
                  <br />
                  듣기
                </h3>
                <p className="text-lg text-gray-500">음성 통화</p>
              </div>
            </button>

            <button
              onClick={openHelpDialog}
              disabled={!hasToken || helpSubmitting}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFF4D6" }}
              >
                {helpSubmitting ? (
                  <Loader2
                    className="w-14 h-14 animate-spin"
                    style={{ color: "#E6A817" }}
                  />
                ) : (
                  <HelpCircle
                    className="w-14 h-14"
                    style={{ color: "#E6A817" }}
                  />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  도움
                  <br />
                  요청하기
                </h3>
                <p className="text-lg text-gray-500">
                  {helpSubmitting ? "요청 중..." : "긴급 연락"}
                </p>
              </div>
            </button>
          </div>

          {lastHelpRequest && (
            <div className="px-10 pb-6">
              <div className="rounded-2xl px-5 py-4 border border-green-200 bg-green-50 text-green-800 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">
                    도움 요청이 접수되었습니다 ·{" "}
                    {lastHelpRequest.handledStatus === "HANDLED"
                      ? "처리 완료"
                      : "처리 대기"}
                  </p>
                  <p className="text-xs text-green-700">
                    {formatStartAt(lastHelpRequest.createdAt)}
                    {lastHelpRequest.requestType
                      ? ` · ${
                          HELP_REQUEST_TYPE_OPTIONS.find(
                            (o) => o.value === lastHelpRequest.requestType,
                          )?.label ?? lastHelpRequest.requestType
                        }`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasToken && !effectiveMatchId && (
            <div className="px-10 pb-8">
              <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                통화를 시작하려면 매칭 정보가 필요합니다. 오늘 확정된 일정이
                없다면 matchId 를 입력해 주세요.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={helpDialogOpen}
        onOpenChange={(open) => {
          if (helpSubmitting) return;
          setHelpDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">도움 요청 보내기</DialogTitle>
            <DialogDescription>
              어떤 도움이 필요하신가요? 운영자에게 즉시 전달돼요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {HELP_REQUEST_TYPE_OPTIONS.map((option) => {
              const selected = helpRequestType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHelpRequestType(option.value)}
                  disabled={helpSubmitting}
                  className={`w-full rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
                    selected
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {option.label}
                    </p>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setHelpDialogOpen(false)}
              disabled={helpSubmitting}
              className="h-11 px-5 bg-white text-gray-700 border hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              onClick={() => void submitHelpRequest()}
              disabled={helpSubmitting}
              className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {helpSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  요청 보내는 중
                </>
              ) : (
                "도움 요청 보내기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
