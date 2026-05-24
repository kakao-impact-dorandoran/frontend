import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Phone,
  Video,
  Calendar,
  MapPin,
  Pencil,
  Check,
  X,
  User,
  Bell,
  AlertCircle,
  Flag,
  OctagonX,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { toast } from "sonner";

type Senior = {
  id: number;
  name: string;
  age: number;
  region: string;
  matchedSince: string;
  lastTalk: string;
  totalTalks: number;
  remainingThisMonth: number;
  nextSchedule: string | null;
  notes: string;
  status: "active" | "pending" | "paused";
};

const initialSeniors: Senior[] = [
  {
    id: 1,
    name: "김복순",
    age: 78,
    region: "서울 노원구",
    matchedSince: "2026.04.10",
    lastTalk: "2026.05.20",
    totalTalks: 8,
    remainingThisMonth: 3,
    nextSchedule: "5월 25일 오후 3시",
    notes: "꽃과 텃밭 가꾸기를 좋아하세요. 옛날 드라마 이야기를 즐기심.",
    status: "active",
  },
];

export default function YouthSeniors() {
  const navigate = useNavigate();
  const [seniors, setSeniors] = useState<Senior[]>(initialSeniors);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [activeSenior, setActiveSenior] = useState<Senior | null>(null);
  const [callConfirmOpen, setCallConfirmOpen] = useState<null | "video" | "voice">(null);
  const [reminderToggle, setReminderToggle] = useState<Record<number, boolean>>({});

  // F-31 신고하기
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<Senior | null>(null);
  const [reportType, setReportType] = useState("부적절한 언행");
  const [reportContent, setReportContent] = useState("");

  // F-32 매칭 중단 요청
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateTarget, setTerminateTarget] = useState<Senior | null>(null);
  const [terminateReason, setTerminateReason] = useState("");

  const openReport = (s: Senior) => { setReportTarget(s); setReportType("부적절한 언행"); setReportContent(""); setReportOpen(true); };
  const handleSubmitReport = () => {
    if (!reportContent.trim()) { toast.error("신고 내용을 입력해주세요."); return; }
    toast.success("신고가 접수되었습니다. 관리자가 검토 후 처리합니다.");
    setReportOpen(false);
  };

  const openTerminate = (s: Senior) => { setTerminateTarget(s); setTerminateReason(""); setTerminateOpen(true); };
  const handleSubmitTerminate = () => {
    if (!terminateReason.trim()) { toast.error("중단 사유를 입력해주세요."); return; }
    toast.success("매칭 중단 요청이 접수되었습니다. 관리자가 확인 후 처리합니다.");
    setTerminateOpen(false);
  };

  const startEdit = (s: Senior) => {
    setEditingId(s.id);
    setDraft(s.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const saveEdit = (id: number) => {
    setSeniors((prev) => prev.map((s) => (s.id === id ? { ...s, notes: draft } : s)));
    setEditingId(null);
    setDraft("");
    toast.success("메모가 저장되었습니다.");
  };

  const openActions = (s: Senior) => {
    if (s.status === "pending") {
      toast.info("아직 매칭 수락 대기 중입니다.");
      return;
    }
    setActiveSenior(s);
  };

  const startCall = (type: "video" | "voice") => {
    setCallConfirmOpen(type);
  };

  const confirmCall = () => {
    if (!activeSenior || !callConfirmOpen) return;
    const senior = encodeURIComponent(`${activeSenior.name} 어르신`);
    setCallConfirmOpen(null);
    setActiveSenior(null);
    navigate(`/youth/call?senior=${senior}&type=${callConfirmOpen}`);
  };

  const toggleReminder = (id: number) => {
    setReminderToggle((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id] ? "리마인드 알림을 켰습니다." : "리마인드 알림을 껐습니다.");
      return next;
    });
  };

  const statusBadge = (status: Senior["status"]) => {
    if (status === "active") return <span className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: '#E8F8F5', color: '#3DAF8A', fontWeight: 600 }}>매칭 중</span>;
    if (status === "pending") return <span className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: '#FFF9E6', color: '#E6A817', fontWeight: 600 }}>수락 대기</span>;
    return <span className="px-3 py-1 text-xs rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>일시 중단</span>;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/youth" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">매칭된 어르신 관리</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 mb-1" style={{ fontSize: '0.85rem' }}>현재 매칭</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A3D' }}>{seniors.filter(s => s.status === 'active').length}명의 어르신</p>
          </div>
          <Link to="/youth/matching">
            <button
              className="px-4 py-2.5 rounded-2xl border text-gray-700"
              style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.88rem' }}
            >
              새 매칭 찾기
            </button>
          </Link>
        </div>

        {seniors.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF4E6' }}>
              <User className="w-8 h-8" style={{ color: '#FF8A3D' }} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">아직 매칭된 어르신이 없어요</p>
            <p className="text-gray-400 mb-4" style={{ fontSize: '0.85rem' }}>매칭 관리에서 어르신을 선택해보세요</p>
            <Link to="/youth/matching">
              <button className="px-6 py-2.5 rounded-2xl text-white" style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.9rem' }}>
                어르신 매칭하기
              </button>
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {seniors.map((s) => {
            const isEditing = editingId === s.id;
            return (
              <div key={s.id} className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.name} 어르신</h3>
                    <p className="text-gray-500" style={{ fontSize: '0.85rem' }}>{s.age}세</p>
                  </div>
                  {statusBadge(s.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: '0.83rem' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{s.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: '0.83rem' }}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>매칭일 {s.matchedSince}</span>
                  </div>
                  <div className="text-gray-500" style={{ fontSize: '0.83rem' }}>최근 대화: {s.lastTalk}</div>
                  <div className="text-gray-500" style={{ fontSize: '0.83rem' }}>총 {s.totalTalks}회 · 이번달 {s.remainingThisMonth}회 남음</div>
                </div>

                {s.nextSchedule && (
                  <div className="rounded-2xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: '#FFF4E6' }}>
                    <div className="flex items-center gap-2" style={{ color: '#FF8A3D' }}>
                      <Bell className="w-4 h-4" />
                      <span style={{ fontSize: '0.83rem' }}>다음 일정: {s.nextSchedule}</span>
                    </div>
                    <button
                      onClick={() => toggleReminder(s.id)}
                      className="text-xs px-3 py-1 rounded-full"
                      style={reminderToggle[s.id]
                        ? { backgroundColor: '#FF8A3D', color: 'white', fontWeight: 600 }
                        : { border: '1px solid #FFD4A8', color: '#FF8A3D', fontWeight: 600 }
                      }
                    >
                      리마인드 {reminderToggle[s.id] ? '켜짐' : '꺼짐'}
                    </button>
                  </div>
                )}

                <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#FAF8F5' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>메모</span>
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(s)}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: '#FF8A3D' }}
                      >
                        <Pencil className="w-3 h-3" />
                        수정
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(s.id)}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: '#3DAF8A' }}
                        >
                          <Check className="w-3 h-3" />
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 text-xs text-gray-400"
                        >
                          <X className="w-3 h-3" />
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      className="w-full p-2 rounded-xl border text-sm text-gray-700 outline-none"
                      style={{ borderColor: '#FFD4A8' }}
                      placeholder="어르신에 대한 메모를 입력하세요"
                    />
                  ) : (
                    <p className="text-gray-600 whitespace-pre-wrap" style={{ fontSize: '0.85rem' }}>{s.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => openActions(s)}
                  className="w-full py-3 rounded-2xl text-white mb-2"
                  style={{ backgroundColor: '#FF8A3D', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  연락하기 / 일정 잡기
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openReport(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs"
                    style={{ borderColor: '#E5E7EB', color: '#EF4444', fontWeight: 600 }}
                  >
                    <Flag className="w-3.5 h-3.5" /> 신고하기
                  </button>
                  <button
                    onClick={() => openTerminate(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280', fontWeight: 600 }}
                  >
                    <OctagonX className="w-3.5 h-3.5" /> 매칭 중단 요청
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action picker dialog */}
      <Dialog open={!!activeSenior && !callConfirmOpen} onOpenChange={(o) => { if (!o) setActiveSenior(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{activeSenior?.name} 어르신과 어떻게 연결할까요?</DialogTitle>
            <DialogDescription>원하시는 방식을 선택해 주세요.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => startCall("video")}
              className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 text-white"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 600 }}
            >
              <Video className="w-6 h-6" />
              화상 통화
            </button>
            <button
              onClick={() => startCall("voice")}
              className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border"
              style={{ borderColor: '#E5E7EB', color: '#374151', fontWeight: 600 }}
            >
              <Phone className="w-6 h-6" />
              음성 통화
            </button>
            <Link to="/youth/schedule" onClick={() => setActiveSenior(null)} className="col-span-2">
              <button
                className="h-20 w-full rounded-2xl flex flex-col items-center justify-center gap-2 border"
                style={{ borderColor: '#E5E7EB', color: '#374151', fontWeight: 600 }}
              >
                <Calendar className="w-6 h-6" />
                일정 잡기
              </button>
            </Link>
            <Link to="/youth/profile" onClick={() => setActiveSenior(null)} className="col-span-2">
              <button className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-gray-500" style={{ fontSize: '0.88rem' }}>
                <User className="w-4 h-4" />
                상세 프로필 보기
              </button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call confirm dialog */}
      <Dialog open={!!callConfirmOpen} onOpenChange={(o) => { if (!o) setCallConfirmOpen(null); }}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {callConfirmOpen === "video" ? <Video className="w-5 h-5" style={{ color: '#FF8A3D' }} /> : <Phone className="w-5 h-5" style={{ color: '#FF8A3D' }} />}
              {callConfirmOpen === "video" ? "화상 통화 시작" : "음성 통화 시작"}
            </DialogTitle>
            <DialogDescription>
              {activeSenior?.name} 어르신께 지금 {callConfirmOpen === "video" ? "화상" : "음성"} 통화를 거시겠어요?
            </DialogDescription>
          </DialogHeader>
          {activeSenior && activeSenior.remainingThisMonth <= 0 && (
            <div className="flex items-start gap-2 text-sm p-3 rounded-2xl" style={{ backgroundColor: '#FFF9E6', color: '#B45309' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>이번 달 이용 가능 횟수를 모두 사용했습니다. 관리자에게 문의해 주세요.</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              onClick={confirmCall}
              className="flex-1 py-3 rounded-2xl text-white"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 700 }}
            >
              네, 시작할게요
            </button>
            <button
              onClick={() => setCallConfirmOpen(null)}
              className="flex-1 py-3 rounded-2xl border text-gray-600"
              style={{ borderColor: '#E5E7EB', fontWeight: 600 }}
            >
              취소
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* F-31 신고하기 다이얼로그 */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              {reportTarget?.name} 어르신 신고
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">신고 유형</p>
              <div className="grid grid-cols-2 gap-2">
                {["부적절한 언행", "약속 불이행", "개인정보 요구", "기타"].map(t => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className="py-2 rounded-2xl text-xs border-2 transition-colors"
                    style={{
                      borderColor: reportType === t ? '#EF4444' : '#E5E7EB',
                      backgroundColor: reportType === t ? '#FEF2F2' : 'white',
                      color: reportType === t ? '#EF4444' : '#6B7280',
                      fontWeight: reportType === t ? 600 : 400,
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">신고 내용</p>
              <textarea
                value={reportContent}
                onChange={e => setReportContent(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="불편했던 상황을 구체적으로 적어주세요."
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-red-300"
              />
              <p className="text-right text-xs text-gray-400">{reportContent.length} / 500자</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setReportOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: '#EF4444' }} onClick={handleSubmitReport}>
                신고 접수
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* F-32 매칭 중단 요청 다이얼로그 */}
      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <OctagonX className="w-5 h-5 text-gray-500" />
              매칭 중단 요청
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-2xl text-sm text-gray-600" style={{ backgroundColor: '#FAF8F5' }}>
              <strong>{terminateTarget?.name} 어르신</strong>과의 매칭 중단을 요청합니다.<br />
              관리자 검토 후 처리되며, 중단 전까지는 매칭이 유지됩니다.
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">중단 사유</p>
              <textarea
                value={terminateReason}
                onChange={e => setTerminateReason(e.target.value.slice(0, 300))}
                rows={4}
                placeholder="중단을 요청하는 사유를 작성해주세요."
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-orange-300"
              />
              <p className="text-right text-xs text-gray-400">{terminateReason.length} / 300자</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setTerminateOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: '#6B7280' }} onClick={handleSubmitTerminate}>
                요청 접수
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}