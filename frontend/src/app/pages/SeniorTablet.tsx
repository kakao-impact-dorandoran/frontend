import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Video, Phone, HelpCircle, PhoneOff, Mic, MicOff, VideoOff, User, Heart, Clock } from "lucide-react";
import { toast } from "sonner";

const mockYouth = {
  name: "김민수",
  image: "https://images.unsplash.com/photo-1770364016662-fd88b591632d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMGZhY2UlMjBmcmllbmRseSUyMHNtaWxpbmclMjBhc2lhbnxlbnwxfHx8fDE3NzU2OTQ0MTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

const mockSenior = {
  name: "김영수",
};

const mockUpcomingCall = {
  youthName: "김민수",
  hoursLater: 2,
  time: "오후 3시",
};

type CallStatus = "ringing" | "in_call";
type Screen =
  | { type: "home" }
  | { type: "video"; status: CallStatus; seconds: number }
  | { type: "voice"; status: CallStatus; seconds: number }
  | { type: "help"; status: "calling" | "connected"; seconds: number };

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function SeniorTablet() {
  const [screen, setScreen] = useState<Screen>({ type: "home" });
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    if (screen.type === "home") return;
    if ((screen.type === "video" || screen.type === "voice") && screen.status === "ringing") {
      const t = setTimeout(() => setScreen({ ...screen, status: "in_call", seconds: 0 }), 2500);
      return () => clearTimeout(t);
    }
    if (screen.type === "help" && screen.status === "calling") {
      const t = setTimeout(() => setScreen({ ...screen, status: "connected", seconds: 0 }), 2000);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => {
      setScreen((prev) => {
        if (prev.type === "home") return prev;
        return { ...prev, seconds: prev.seconds + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen.type, "status" in screen ? screen.status : null]);

  const startVideo = () => setScreen({ type: "video", status: "ringing", seconds: 0 });
  const startVoice = () => setScreen({ type: "voice", status: "ringing", seconds: 0 });
  const startHelp = () => setScreen({ type: "help", status: "calling", seconds: 0 });

  const endCall = () => {
    if (screen.type !== "home") {
      const isCall = screen.type === "video" || screen.type === "voice";
      if (isCall && (screen as any).status === "in_call") {
        toast.success(`통화가 종료되었습니다 · ${formatTime((screen as any).seconds)}`);
      } else {
        toast.info("종료되었습니다.");
      }
    }
    setMuted(false);
    setCameraOff(false);
    setScreen({ type: "home" });
  };

  if (screen.type === "video") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col text-white" style={{ fontFamily: 'Pretendard, sans-serif' }}>
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
            <p className="text-3xl font-bold">{mockYouth.name} 청년</p>
            <p className="text-xl mt-1">
              {screen.status === "ringing" ? "연결 중..." : formatTime(screen.seconds)}
            </p>
          </div>
          <div className="absolute bottom-8 right-8 w-40 h-56 bg-gray-700 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center">
            <p className="text-lg">내 모습</p>
          </div>
        </div>
        <div className="bg-black/80 p-8 flex justify-center gap-6">
          <Button
            onClick={() => setMuted((m) => !m)}
            className={`w-24 h-24 rounded-full ${muted ? "bg-gray-600" : "bg-gray-700"} hover:bg-gray-600`}
          >
            {muted ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </Button>
          <Button
            onClick={() => setCameraOff((c) => !c)}
            className={`w-24 h-24 rounded-full ${cameraOff ? "bg-gray-600" : "bg-gray-700"} hover:bg-gray-600`}
          >
            {cameraOff ? <VideoOff className="w-10 h-10" /> : <Video className="w-10 h-10" />}
          </Button>
          <Button onClick={endCall} className="w-32 h-24 rounded-full bg-red-600 hover:bg-red-700">
            <PhoneOff className="w-10 h-10 mr-2" />
            <span className="text-2xl font-bold">끊기</span>
          </Button>
        </div>
      </div>
    );
  }

  if (screen.type === "voice") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-between p-12"
        style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}
      >
        {/* Top area */}
        <div className="w-full flex justify-center pt-4">
          <span className="text-2xl text-gray-400 tracking-widest">
            {screen.status === "ringing" ? "연결 중..." : "통화 중"}
          </span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-8">
          {/* Avatar with pulse ring */}
          <div className="relative flex items-center justify-center">
            {screen.status === "in_call" && (
              <>
                <div className="absolute w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#FF8A3D', animation: 'ping 3.6s cubic-bezier(0,0,0.2,1) infinite' }} />
                <div className="absolute w-72 h-72 rounded-full opacity-20" style={{ backgroundColor: '#FF8A3D', animation: 'ping 3.6s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '1.2s' }} />
              </>
            )}
            <div className="w-64 h-64 rounded-full flex items-center justify-center shadow-2xl relative z-10" style={{ backgroundColor: '#FFE8D6' }}>
              <User className="w-32 h-32" style={{ color: '#FF8A3D' }} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900">{mockYouth.name} 청년</h2>
            <p className="text-3xl mt-3" style={{ color: '#FF8A3D' }}>
              {screen.status === "ringing" ? "🔔 연결 중..." : formatTime(screen.seconds)}
            </p>
          </div>

          {/* Sound wave bars */}
          {screen.status === "in_call" && (
            <div className="flex items-end gap-2 h-12">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="w-3 rounded-full animate-pulse"
                  style={{
                    height: `${16 + (i % 4) * 12}px`,
                    backgroundColor: '#FF8A3D',
                    opacity: 0.7,
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-10 items-center">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setMuted((m) => !m)}
              className="w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-md"
              style={{ backgroundColor: muted ? '#e5e7eb' : '#fff', border: '2px solid #e5e7eb' }}
            >
              {muted
                ? <MicOff className="w-14 h-14 text-gray-500" />
                : <Mic className="w-14 h-14 text-gray-600" />
              }
            </button>
            <span className="text-xl text-gray-500">{muted ? "음소거 중" : "마이크"}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={endCall}
              className="w-36 h-36 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105"
              style={{ backgroundColor: '#FF4444' }}
            >
              <PhoneOff className="w-14 h-14 text-white" />
            </button>
            <span className="text-2xl font-bold text-gray-700">끊기</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen.type === "help") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-100 to-orange-50 flex flex-col items-center justify-center p-12" style={{ fontFamily: 'Pretendard, sans-serif' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
            <HelpCircle className="w-20 h-20 text-orange-600" />
          </div>
          {screen.status === "calling" ? (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">관리자 호출 중...</h2>
              <p className="text-2xl text-gray-700 mb-8">잠시만 기다려 주세요</p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">관리자와 연결되었습니다</h2>
              <p className="text-2xl text-gray-700 mb-2">통화 시간 {formatTime(screen.seconds)}</p>
              <p className="text-xl text-gray-600 mb-8">담당자: 이수진 매니저 (1588-0000)</p>
            </>
          )}
          <Button onClick={endCall} className="w-full h-20 text-3xl font-bold bg-red-600 hover:bg-red-700 rounded-2xl">
            <PhoneOff className="w-8 h-8 mr-3" />
            종료하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#F0EDE8' }}
    >
      {/* Main card — mimics the tablet bezel in the reference image */}
      <div
        className="w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#1E1E2E', padding: '6px' }}
      >
        <div className="rounded-[2.6rem] overflow-hidden" style={{ backgroundColor: '#FAF8F5' }}>

          {/* Card header */}
          <div className="flex items-center justify-between px-10 pt-9 pb-5">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8" style={{ color: '#FF8A3D' }} />
              <span className="text-3xl font-bold text-gray-900">도란도란</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-700">{mockSenior.name} 어르신</span>
              <span className="text-2xl">👋</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-10 pb-5">
            <p className="text-2xl text-gray-600">오늘도 따뜻한 하루 되세요 😊</p>
          </div>

          {/* Upcoming call banner */}
          <div className="px-10 pb-6">
            <div
              className="flex items-center gap-4 rounded-2xl px-6 py-4"
              style={{ backgroundColor: '#FFF4E6' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
                <Clock className="w-5 h-5" style={{ color: '#FF8A3D' }} />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-800">
                  {mockUpcomingCall.hoursLater}시간 후 · {mockUpcomingCall.youthName} 청년과 통화 예정
                </p>
                <p className="text-lg text-gray-500">오늘 {mockUpcomingCall.time} 예약되어 있어요</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-3 gap-5 px-10 pb-10">
            <button
              onClick={startVideo}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10"
            >
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFE8D6' }}>
                <Video className="w-14 h-14" style={{ color: '#FF8A3D' }} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">얼굴 보며<br/>전화하기</h3>
                <p className="text-lg text-gray-500">화상 통화</p>
              </div>
            </button>

            <button
              onClick={startVoice}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10"
            >
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D4EDE4' }}>
                <Phone className="w-14 h-14" style={{ color: '#3DAF8A' }} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">목소리만<br/>듣기</h3>
                <p className="text-lg text-gray-500">음성 통화</p>
              </div>
            </button>

            <button
              onClick={startHelp}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-5 border-0 cursor-pointer py-10"
            >
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4D6' }}>
                <HelpCircle className="w-14 h-14" style={{ color: '#E6A817' }} />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">도움<br/>요청하기</h3>
                <p className="text-lg text-gray-500">긴급 연락</p>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}