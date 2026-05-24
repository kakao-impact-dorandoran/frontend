import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

type CallStatus = "connecting" | "in_call";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function YouthCallScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const seniorName = searchParams.get("senior") ?? "김복순 어르신";
  const callType = (searchParams.get("type") ?? "video") as "video" | "voice";

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    const connectTimer = setTimeout(() => setStatus("in_call"), 2500);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (status !== "in_call") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const handleHangUp = () => navigate(-1);

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
        {/* 마이크 */}
        <button
          onClick={() => setMuted((v) => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: muted ? "#374151" : "rgba(255,255,255,0.15)" }}
        >
          {muted
            ? <MicOff className="w-6 h-6 text-white" />
            : <Mic className="w-6 h-6 text-white" />}
        </button>

        {/* 카메라 (화상통화만) */}
        {callType === "video" && (
          <button
            onClick={() => setCameraOff((v) => !v)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: cameraOff ? "#374151" : "rgba(255,255,255,0.15)" }}
          >
            {cameraOff
              ? <VideoOff className="w-6 h-6 text-white" />
              : <Video className="w-6 h-6 text-white" />}
          </button>
        )}

        {/* 끊기 */}
        <button
          onClick={handleHangUp}
          className="h-14 px-6 rounded-full flex items-center justify-center gap-2"
          style={{ backgroundColor: "#EF4444" }}
        >
          <PhoneOff className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">끊기</span>
        </button>
      </div>
    </div>
  );
}
