import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ArrowLeft, MessageCircle, Video, Phone, Award, Clock, CheckCircle, Download, PenLine, Plus } from "lucide-react";
import { toast } from "sonner";

const CERT_THRESHOLD_MINUTES = 600; // 10시간

type Conversation = {
  id: number;
  name: string;
  date: string;
  duration: number;
  type: "video" | "voice";
  summary: string;
  logged: boolean;
  loggedMinutes: number; // 실제 활동 기록 제출 시 합산된 분
};

export default function YouthConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  const [certIssued, setCertIssued] = useState(false);
  const [certSerial] = useState(`DRDR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`);

  // 대화 추가 다이얼로그
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", type: "video" as "video" | "voice", duration: "", summary: "" });

  // 활동 기록 작성 다이얼로그 (F-28)
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [logDone, setLogDone] = useState(true);
  const [actualMinutes, setActualMinutes] = useState("");
  const [specialNote, setSpecialNote] = useState("");

  // 증명서 발급 다이얼로그 (F-30)
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  const canIssueCert = accumulatedMinutes >= CERT_THRESHOLD_MINUTES;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "");

  // 대화 추가
  const handleAddConversation = () => {
    if (!addForm.name.trim()) { toast.error("어르신 이름을 입력해주세요."); return; }
    const conv: Conversation = {
      id: Date.now(),
      name: addForm.name.trim().endsWith("어르신") ? addForm.name.trim() : `${addForm.name.trim()} 어르신`,
      date: today,
      duration: Number(addForm.duration) || 0,
      type: addForm.type,
      summary: addForm.summary.trim(),
      logged: false,
      loggedMinutes: 0,
    };
    setConversations(prev => [conv, ...prev]);
    setAddForm({ name: "", type: "video", duration: "", summary: "" });
    setAddDialogOpen(false);
    toast.success("대화가 추가되었습니다. 활동 기록을 작성해주세요.");
  };

  // 활동 기록 작성 열기
  const handleOpenLog = (conv: Conversation) => {
    setSelectedConv(conv);
    setActualMinutes(String(conv.duration || ""));
    setSpecialNote("");
    setLogDone(true);
    setLogDialogOpen(true);
  };

  // 활동 기록 제출 (F-28) — 누적 시간 합산
  const handleSubmitLog = () => {
    if (logDone && (!actualMinutes || Number(actualMinutes) < 0)) {
      toast.error("실제 대화 시간을 입력해주세요."); return;
    }
    const mins = logDone ? Number(actualMinutes) : 0;
    setConversations(prev =>
      prev.map(c => c.id === selectedConv?.id
        ? { ...c, logged: true, loggedMinutes: mins, summary: specialNote || c.summary }
        : c
      )
    );
    if (logDone) setAccumulatedMinutes(prev => prev + mins);
    toast.success("활동 기록이 제출되었습니다!");
    setLogDialogOpen(false);
  };

  // 증명서 발급
  const handleIssueCert = () => {
    setCertIssued(true);
    toast.success("사회참여 활동 증명서가 발급되었습니다!");
    setCertDialogOpen(false);
  };

  const thisMonthCount = conversations.length;
  const thisMonthMinutes = conversations.reduce((s, c) => s + c.loggedMinutes, 0);

  return (
    <div className="min-h-screen" style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/youth" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: "#FF8A3D" }} />
              <h1 className="text-xl font-bold text-gray-900">증명서</h1>
            </div>
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-sm"
            style={{ backgroundColor: "#FF8A3D", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> 대화 추가
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* 이번 달 요약 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
          <p className="text-gray-500 mb-1" style={{ fontSize: "0.85rem" }}>
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}
          </p>
          <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FF8A3D" }}>{thisMonthCount}회 대화</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: "0.88rem" }}>
            {thisMonthMinutes > 0 ? `총 ${thisMonthMinutes}분 대화했어요 🎉` : "대화 후 활동 기록을 작성해주세요"}
          </p>
        </div>

        {/* 누적 활동 시간 & 증명서 (F-30) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF9E6" }}>
                <Award className="w-5 h-5" style={{ color: "#E6A817" }} />
              </div>
              <div>
                <p className="font-bold text-gray-900">누적 활동 시간</p>
                <p className="text-xs text-gray-400">사회참여 활동 증명서 기준: 10시간</p>
              </div>
            </div>
            {canIssueCert && !certIssued && (
              <Button size="sm" className="rounded-xl" style={{ backgroundColor: "#E6A817" }} onClick={() => setCertDialogOpen(true)}>
                <Download className="w-3.5 h-3.5 mr-1" /> 증명서 발급
              </Button>
            )}
            {certIssued && (
              <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#3DAF8A" }}>
                <CheckCircle className="w-4 h-4" /> 발급 완료
              </span>
            )}
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{Math.floor(accumulatedMinutes / 60)}시간 {accumulatedMinutes % 60}분</span>
              <span>목표 10시간</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((accumulatedMinutes / CERT_THRESHOLD_MINUTES) * 100, 100)}%`,
                  background: canIssueCert
                    ? "linear-gradient(90deg, #3DAF8A, #52C9A0)"
                    : "linear-gradient(90deg, #FF8A3D, #FFB347)",
                }}
              />
            </div>
          </div>

          {canIssueCert ? (
            <p className="text-xs" style={{ color: "#3DAF8A" }}>
              {certIssued ? `증명서 발급 완료 (${certSerial})` : "🎉 기준 달성! 증명서 발급이 가능합니다."}
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              {CERT_THRESHOLD_MINUTES - accumulatedMinutes}분 더 활동하면 증명서를 발급받을 수 있어요.
            </p>
          )}
        </div>

        {/* 대화 목록 */}
        <div className="space-y-3">
          {conversations.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: c.type === "video" ? "#EBF4FF" : "#E8F8F5" }}
                >
                  {c.type === "video"
                    ? <Video className="w-5 h-5" style={{ color: "#3D7AFF" }} />
                    : <Phone className="w-5 h-5" style={{ color: "#3DAF8A" }} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-gray-900" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.name}</h3>
                    <span className="text-gray-400" style={{ fontSize: "0.8rem" }}>{c.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400" style={{ fontSize: "0.82rem" }}>
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      {c.logged ? `${c.loggedMinutes}분` : `${c.duration || "-"}분`} · {c.type === "video" ? "화상" : "음성"} 통화
                    </span>
                    {c.logged
                      ? <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: "#3DAF8A" }}><CheckCircle className="w-3 h-3" /> 기록 완료</span>
                      : <span className="text-xs text-orange-400 font-medium">기록 미작성</span>}
                  </div>
                  {c.summary && (
                    <p className="text-gray-600" style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>{c.summary}</p>
                  )}
                </div>
              </div>
              {!c.logged && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <Button
                    size="sm" variant="outline" className="w-full rounded-xl text-sm"
                    style={{ borderColor: "#FF8A3D", color: "#FF8A3D" }}
                    onClick={() => handleOpenLog(c)}
                  >
                    <PenLine className="w-3.5 h-3.5 mr-1" /> 활동 기록 작성 (F-28)
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {conversations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>아직 대화 기록이 없어요</p>
          </div>
        )}
      </div>

      {/* 대화 추가 다이얼로그 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>대화 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">어르신 이름</p>
              <input
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="예) 김영수"
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">통화 유형</p>
              <div className="flex gap-2">
                {[["video", "화상 통화"], ["voice", "음성 통화"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setAddForm(f => ({ ...f, type: val as "video" | "voice" }))}
                    className="flex-1 py-2 rounded-2xl text-sm border-2 transition-colors"
                    style={{
                      borderColor: addForm.type === val ? "#FF8A3D" : "#E5E7EB",
                      backgroundColor: addForm.type === val ? "#FFF4E6" : "white",
                      color: addForm.type === val ? "#FF8A3D" : "#6B7280",
                      fontWeight: addForm.type === val ? 600 : 400,
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">예상 대화 시간 (분)</p>
              <input
                type="number" min={0}
                value={addForm.duration}
                onChange={e => setAddForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="예) 30"
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">메모 (선택)</p>
              <Textarea
                value={addForm.summary}
                onChange={e => setAddForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="대화 주제나 메모를 입력하세요"
                className="rounded-2xl resize-none text-sm" rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setAddDialogOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: "#FF8A3D" }} onClick={handleAddConversation}>
                추가하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 활동 기록 작성 다이얼로그 (F-28) */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>활동 기록 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: "#FAF8F5" }}>
              <p className="text-sm text-gray-500">{selectedConv?.date} · {selectedConv?.name}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">대화 진행 여부</p>
              <div className="flex gap-2">
                {["진행 완료", "진행 불가"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setLogDone(opt === "진행 완료")}
                    className="flex-1 py-2 rounded-2xl text-sm border-2 transition-colors"
                    style={{
                      borderColor: (logDone && opt === "진행 완료") || (!logDone && opt === "진행 불가") ? "#FF8A3D" : "#E5E7EB",
                      backgroundColor: (logDone && opt === "진행 완료") || (!logDone && opt === "진행 불가") ? "#FFF4E6" : "white",
                      color: (logDone && opt === "진행 완료") || (!logDone && opt === "진행 불가") ? "#FF8A3D" : "#6B7280",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            {logDone && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700">실제 대화 시간 (분)</p>
                <input
                  type="number" min={0}
                  value={actualMinutes}
                  onChange={e => setActualMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-300"
                  placeholder="예) 30"
                />
                <p className="text-xs text-gray-400">입력한 시간이 누적 활동 시간에 합산됩니다.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">특이사항 (선택)</p>
              <Textarea
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                placeholder="대화 중 특이사항이 있으면 기록해주세요."
                className="rounded-2xl resize-none text-sm" rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setLogDialogOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: "#FF8A3D" }} onClick={handleSubmitLog}>
                기록 제출
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 증명서 발급 다이얼로그 (F-30) */}
      <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFF9E6" }}>
                <Award className="w-8 h-8" style={{ color: "#E6A817" }} />
              </div>
            </div>
            <DialogTitle className="text-center">사회참여 활동 증명서 발급</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              총 <strong>{Math.floor(accumulatedMinutes / 60)}시간 {accumulatedMinutes % 60}분</strong>의 활동이 확인되었습니다.<br />
              고유 발급 번호와 함께 공인 증명서가 발급됩니다.
            </p>
            <div className="p-3 rounded-2xl" style={{ backgroundColor: "#FFF9E6" }}>
              <p className="text-xs text-gray-500 mb-0.5">발급 시리얼 번호</p>
              <p className="font-mono font-bold" style={{ color: "#E6A817" }}>{certSerial}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setCertDialogOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: "#E6A817" }} onClick={handleIssueCert}>
                <Download className="w-4 h-4 mr-1" /> PDF 발급
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
