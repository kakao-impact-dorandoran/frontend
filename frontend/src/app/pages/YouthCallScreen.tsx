import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  User,
  BookOpen,
  Loader2,
} from "lucide-react";
import { endCallByYouth } from "../../lib/api/call";
import { ApiError } from "../../lib/api/client";
import { ErrorCode } from "../../types/api";

type CallStatus = "connecting" | "in_call" | "ended";

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
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
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return err.message || "이 통화를 종료할 권한이 없습니다.";
    if (err.status === 404) return "통화 기록을 찾을 수 없습니다.";
    return err.message || "통화 종료를 기록하지 못했습니다.";
  }
  return "통화 종료를 기록하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

export default function YouthCallScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const seniorName = searchParams.get("senior") ?? "어르신";
  const callType = (searchParams.get("type") ?? "video") as "video" | "voice";
  const queryCallLogId = searchParams.get("callLogId");
  const queryMatchId = searchParams.get("matchId");
  const queryScheduleId = searchParams.get("scheduleId");

  const hasCallLog = Boolean(queryCallLogId);

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endedDuration, setEndedDuration] = useState<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setStatus("in_call"), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status !== "in_call") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsedMinutes = useMemo(
    () => Math.max(1, Math.round(seconds / 60)),
    [seconds],
  );

  const goToActivityJournal = useCallback(() => {
    const params = new URLSearchParams();
    if (queryCallLogId) params.set("callLogId", queryCallLogId);
    if (queryMatchId) params.set("matchId", queryMatchId);
    if (queryScheduleId) params.set("scheduleId", queryScheduleId);
    if (endedDuration != null) params.set("durationMinutes", String(endedDuration));
    const qs = params.toString();
    navigate(qs ? `/youth/journal?${qs}` : "/youth/journal");
  }, [navigate, queryCallLogId, queryMatchId, queryScheduleId, endedDuration]);

  const handleHangUp = useCallback(async () => {
    if (endedRef.current || ending) return;

    if (!hasCallLog || !queryCallLogId) {
      navigate(-1);
      return;
    }

    endedRef.current = true;
    setEnding(true);
    try {
      await endCallByYouth(queryCallLogId);
      setStatus("ended");
      setEndedDuration(elapsedMinutes);
      toast.success("통화가 종료되었습니다.");
    } catch (err) {
      endedRef.current = false;
      toast.error(resolveEndCallError(err));
    } finally {
      setEnding(false);
    }
  }, [hasCallLog, queryCallLogId, ending, navigate, elapsedMinutes]);

  if (status === "ended") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: "#1a2235", fontFamily: "Pretendard, sans-serif" }}
      >
        <div
          className="w-full max-w-sm rounded-3xl px-6 py-8 text-center"
          style={{ backgroundColor: "white" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#FFF4E6" }}
          >
            <PhoneOff className="w-7 h-7" style={{ color: "#FF8A3D" }} />
          </div>
          <p className="font-bold text-gray-900 mb-1" style={{ fontSize: "1.1rem" }}>
            통화가 종료되었습니다
          </p>
          <p className="text-gray-500 mb-5" style={{ fontSize: "0.9rem" }}>
            {seniorName} · 통화 시간 {formatTime(seconds)}
            {endedDuration != null && (
              <span className="text-gray-400"> ({endedDuration}분)</span>
            )}
          </p>

          <button
            onClick={goToActivityJournal}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-white mb-2"
            style={{ backgroundColor: "#FF8A3D", fontWeight: 700 }}
          >
            <BookOpen className="w-4 h-4" />
            활동 기록 작성하기
          </button>
          <button
            onClick={() => navigate("/youth")}
            className="w-full py-3 rounded-2xl border text-gray-600"
            style={{ borderColor: "#E5E7EB", fontWeight: 600 }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "#1a2235", fontFamily: "Pretendard, sans-serif" }}
    >
      {/* 상대방 이름 + 상태 */}
      <div className="flex justify-center pt-10">
        <div
          className="px-5 py-2.5 rounded-full text-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <p className="text-white font-bold" style={{ fontSize: "1.1rem" }}>
            {seniorName}
          </p>
          <p style={{ color: "#CBD5E1", fontSize: "0.82rem" }}>
            {status === "connecting" ? "연결 중..." : formatTime(seconds)}
          </p>
        </div>
      </div>

      {!hasCallLog && (
        <div className="flex justify-center px-4 mt-3">
          <div
            className="px-3 py-1.5 rounded-xl text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", maxWidth: "20rem" }}
          >
            <p className="text-white/70" style={{ fontSize: "0.72rem" }}>
              통화 기록은 어르신 기기에서 시작돼요. 끊기 시 활동 기록은 따로 입력해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* 상대방 영상 영역 */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <User className="w-16 h-16" style={{ color: "rgba(255,255,255,0.4)" }} />
        </div>
      </div>

      {/* 내 모습 (화상통화만) */}
      {callType === "video" && (
        <div
          className="absolute bottom-32 right-5 w-28 h-40 rounded-2xl flex items-center justify-center border-2"
          style={{ backgroundColor: "#2d3a4f", borderColor: "rgba(255,255,255,0.2)" }}
        >
          {cameraOff ? (
            <User className="w-8 h-8" style={{ color: "rgba(255,255,255,0.3)" }} />
          ) : (
            <p className="text-white/40 text-xs text-center px-2">내 모습</p>
          )}
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div
        className="pb-12 pt-4 flex items-center justify-center gap-6"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      >
        <button
          onClick={() => setMuted((v) => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: muted ? "#374151" : "rgba(255,255,255,0.15)" }}
          disabled={ending}
        >
          {muted
            ? <MicOff className="w-6 h-6 text-white" />
            : <Mic className="w-6 h-6 text-white" />}
        </button>

        {callType === "video" && (
          <button
            onClick={() => setCameraOff((v) => !v)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: cameraOff ? "#374151" : "rgba(255,255,255,0.15)" }}
            disabled={ending}
          >
            {cameraOff
              ? <VideoOff className="w-6 h-6 text-white" />
              : <Video className="w-6 h-6 text-white" />}
          </button>
        )}

        <button
          onClick={() => void handleHangUp()}
          disabled={ending}
          className="h-14 px-6 rounded-full flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ backgroundColor: "#EF4444" }}
        >
          {ending ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <PhoneOff className="w-5 h-5 text-white" />
          )}
          <span className="text-white font-bold text-sm">
            {ending ? "종료 중..." : "끊기"}
          </span>
        </button>
      </div>
    </div>
  );
}
