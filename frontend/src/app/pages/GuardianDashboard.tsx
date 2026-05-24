import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Heart, LogOut, User, Plus, Tablet, ChevronRight, CheckCircle, XCircle, AlertCircle, Clock, FileText, Flag, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";

type DeviceStatus = "READY" | "SHIPPING" | "DELIVERED";

type ActivityRecord = {
  id: number;
  date: string;
  youthName: string;
  done: boolean;
  duration: number | null;
  note: string;
};

type Senior = {
  id: number;
  name: string;
  age: number;
  region: string;
  deviceStatus: DeviceStatus;
  activities: ActivityRecord[];
};

const DEVICE_LABEL: Record<DeviceStatus, { label: string; color: string; bg: string }> = {
  READY:     { label: "배송 준비 중", color: "#E6A817", bg: "#FFF9E6" },
  SHIPPING:  { label: "배송 중",      color: "#3D7AFF", bg: "#EBF4FF" },
  DELIVERED: { label: "배송 완료",    color: "#3DAF8A", bg: "#E8F8F5" },
};

export default function GuardianDashboard() {
  const navigate = useNavigate();
  const [seniors] = useState<Senior[]>([]);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  // F-31 신고하기
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<Senior | null>(null);
  const [reportType, setReportType] = useState("부적절한 언행");
  const [reportContent, setReportContent] = useState("");

  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [journalYear, setJournalYear] = useState("2026");
  const [journalMonth, setJournalMonth] = useState("5월");

  const JOURNALS = [
    { youth: "최윤정", year: "2026", month: "5월", date: "5월 20일", duration: "32분", type: "화상통화", content: "오늘 어머니께서 옛날 이야기를 많이 해주셨어요. 어린 시절 시골에서 살았던 이야기가 정말 재미있었습니다. 다음에는 좋아하시는 음식 이야기를 더 나눠보고 싶어요." },
    { youth: "최윤정", year: "2026", month: "5월", date: "5월 13일", duration: "28분", type: "음성통화", content: "건강에 대해 이야기 나눴어요. 요즘 날씨 때문에 무릎이 아프시다고 하셔서 걱정이 됐어요. 다음에 통화 시작할 때 꼭 안부를 여쭤봐야겠어요." },
    { youth: "최윤정", year: "2026", month: "5월", date: "5월 6일", duration: "35분", type: "화상통화", content: "어린 시절 즐겨 드시던 음식 이야기를 나눴어요. 된장찌개 이야기에 눈이 반짝이셨어요. 다음엔 함께 레시피 이야기도 해보고 싶어요." },
    { youth: "최윤정", year: "2026", month: "4월", date: "4월 29일", duration: "22분", type: "음성통화", content: "날씨가 좋아서 기분이 좋으시다고 하셨어요. 봄꽃 이야기를 많이 하셨는데 정원 가꾸기를 좋아하신다는 것을 알게 됐어요." },
    { youth: "최윤정", year: "2026", month: "4월", date: "4월 22일", duration: "40분", type: "화상통화", content: "자녀분들 이야기를 많이 해주셨어요. 멀리 사는 아들이 보고 싶으시다고 하셨는데 많이 마음이 쓰였어요." },
    { youth: "최윤정", year: "2026", month: "4월", date: "4월 15일", duration: "30분", type: "화상통화", content: "어머니께서 좋아하시는 노래 이야기를 나눴어요. 같이 흥얼거리며 즐거운 시간을 보냈습니다." },
    { youth: "최윤정", year: "2026", month: "3월", date: "3월 25일", duration: "45분", type: "화상통화", content: "첫 통화라 긴장됐는데 어머니께서 먼저 편하게 대해주셔서 금방 친해졌어요. 다음이 기대됩니다." },
    { youth: "최윤정", year: "2026", month: "3월", date: "3월 18일", duration: "20분", type: "음성통화", content: "짧은 통화였지만 오늘 드신 점심 메뉴 이야기를 나눴어요. 소소하지만 따뜻한 대화였습니다." },
    { youth: "최윤정", year: "2025", month: "12월", date: "12월 30일", duration: "38분", type: "화상통화", content: "연말이라 한 해 이야기를 나눴어요. 올해 좋았던 순간들을 함께 돌아봤습니다." },
    { youth: "최윤정", year: "2025", month: "12월", date: "12월 16일", duration: "25분", type: "음성통화", content: "크리스마스 이야기를 나눴어요. 어머니의 어린 시절 크리스마스 추억이 참 따뜻했어요." },
    { youth: "최윤정", year: "2025", month: "11월", date: "11월 28일", duration: "33분", type: "화상통화", content: "날이 추워지셨다고 걱정이 됐어요. 따뜻하게 입고 다니시라고 말씀드렸습니다." },
  ];
  const journalYears = [...new Set(JOURNALS.map(j => j.year))];
  const monthsInYear = [...new Set(JOURNALS.filter(j => j.year === journalYear).map(j => j.month))];
  const filteredJournals = JOURNALS.filter(j => j.year === journalYear && j.month === journalMonth);

  const openReport = (senior: Senior) => { setReportTarget(senior); setReportType("부적절한 언행"); setReportContent(""); setReportOpen(true); };
  const handleSubmitReport = () => {
    if (!reportContent.trim()) { toast.error("신고 내용을 입력해주세요."); return; }
    toast.success("신고가 접수되었습니다. 관리자가 검토 후 처리합니다.");
    setReportOpen(false);
  };

  const openRecords = (senior: Senior) => {
    setSelectedSenior(senior);
    setRecordDialogOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
            <span className="text-xl font-bold text-gray-900">도란도란</span>
          </Link>
          <button
            onClick={() => setLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* 환영 배너 */}
        <style>{`
          @keyframes gdrift1{0%{transform:translate(0,0)}20%{transform:translate(30px,-40px)}40%{transform:translate(-20px,-60px)}60%{transform:translate(-50px,-20px)}80%{transform:translate(20px,10px)}100%{transform:translate(0,0)}}
          @keyframes gdrift2{0%{transform:translate(0,0)}25%{transform:translate(-40px,30px)}50%{transform:translate(30px,50px)}75%{transform:translate(50px,-10px)}100%{transform:translate(0,0)}}
          @keyframes gdrift3{0%{transform:translate(0,0)}30%{transform:translate(-50px,-30px)}60%{transform:translate(40px,-50px)}100%{transform:translate(0,0)}}
        `}</style>
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3DAF8A 0%, #52C9A0 100%)' }}>
          <div className="relative z-10">
            <h1 className="text-white mb-1" style={{ fontSize: '1.5rem', fontWeight: 700 }}>최보호님 반가워요! 👋</h1>
            <p className="text-white/80 text-sm">어르신의 대화 활동을 확인하세요</p>
          </div>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" style={{ animation: 'gdrift1 13s ease-in-out infinite' }} />
          <div className="absolute -right-2 -bottom-12 w-32 h-32 rounded-full bg-white/10" style={{ animation: 'gdrift2 13s ease-in-out infinite 2s' }} />
          <div className="absolute left-1/2 -bottom-6 w-24 h-24 rounded-full bg-white/10" style={{ animation: 'gdrift3 13s ease-in-out infinite 4s' }} />
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/guardian/senior-profile">
            <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F8F5' }}>
                <Plus className="w-5 h-5" style={{ color: '#3DAF8A' }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontSize: '0.9rem' }}>어르신 등록</p>
                <p className="text-gray-500" style={{ fontSize: '0.75rem' }}>프로필 등록 · 기기 신청</p>
              </div>
            </div>
          </Link>
          <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EBF4FF' }}>
              <Tablet className="w-5 h-5" style={{ color: '#3D7AFF' }} />
            </div>
            <div>
              <p className="font-semibold text-gray-900" style={{ fontSize: '0.9rem' }}>전용 기기 현황</p>
              <p className="text-gray-500" style={{ fontSize: '0.75rem' }}>배송 상태 확인</p>
            </div>
          </div>
        </div>

        {/* 청년 활동 일지 (F-29) */}
        <div className="flex items-center justify-between mb-3 mt-2">
          <h2 className="text-gray-700" style={{ fontSize: '1rem', fontWeight: 600 }}>청년 활동 일지</h2>
          <button
            onClick={() => setJournalDialogOpen(true)}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#3DAF8A' }}
          >
            전체 보기 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mb-6 space-y-3">
          {JOURNALS.slice(0, 2).map((j, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>🧑</div>
                <div>
                  <p className="font-semibold text-gray-900" style={{ fontSize: '0.88rem' }}>{j.youth} 청년</p>
                  <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{j.date} · {j.duration} · {j.type}</p>
                </div>
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FAF8F5' }}>
                <p className="text-gray-600 leading-relaxed line-clamp-2" style={{ fontSize: '0.85rem' }}>{j.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 등록된 어르신 목록 */}
        <h2 className="text-gray-700 mb-3" style={{ fontSize: '1rem', fontWeight: 600 }}>등록된 어르신</h2>

        {seniors.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8F8F5' }}>
              <User className="w-8 h-8" style={{ color: '#3DAF8A' }} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">등록된 어르신이 없어요</p>
            <p className="text-gray-400 mb-4" style={{ fontSize: '0.85rem' }}>어르신 프로필을 등록하면 전용 태블릿이 무상으로 제공됩니다</p>
            <Link to="/guardian/senior-profile">
              <button className="px-6 py-2.5 rounded-2xl text-white" style={{ backgroundColor: '#3DAF8A', fontWeight: 600, fontSize: '0.9rem' }}>
                어르신 등록하기
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {seniors.map((senior) => {
              const device = DEVICE_LABEL[senior.deviceStatus];
              const recentActivities = senior.activities.slice(0, 3);
              const totalDone = senior.activities.filter(a => a.done).length;

              return (
                <div key={senior.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {/* 어르신 정보 헤더 */}
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{senior.name} 어르신</p>
                          <p className="text-gray-500" style={{ fontSize: '0.82rem' }}>{senior.age}세 · {senior.region}</p>
                        </div>
                      </div>
                      {/* 기기 배송 상태 (F-12) */}
                      <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: device.bg, color: device.color, fontWeight: 600 }}>
                        <Tablet className="w-3 h-3 inline mr-1" />
                        {device.label}
                      </span>
                    </div>
                  </div>

                  {/* 활동 기록 요약 (F-29) */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-gray-700" style={{ fontSize: '0.88rem' }}>
                          활동 기록 <span className="text-gray-400 font-normal">({totalDone}/{senior.activities.length}회 진행)</span>
                        </p>
                      </div>
                      <button
                        onClick={() => openRecords(senior)}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: '#3DAF8A' }}
                      >
                        전체 보기 <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {recentActivities.length === 0 ? (
                      <p className="text-gray-400 text-sm py-2">아직 기록된 활동이 없어요</p>
                    ) : (
                      <div className="space-y-2">
                        {recentActivities.map((act) => (
                          <div key={act.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: '#FAF8F5' }}>
                            {act.done
                              ? <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#3DAF8A' }} />
                              : <XCircle className="w-4 h-4 flex-shrink-0 text-gray-300" />
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700" style={{ fontSize: '0.83rem', fontWeight: 600 }}>{act.date}</span>
                                <span className="text-gray-500" style={{ fontSize: '0.78rem' }}>
                                  {act.done ? `${act.duration}분 · ${act.youthName}` : "진행 안됨"}
                                </span>
                              </div>
                              {act.note && (
                                <p className="text-gray-400 truncate mt-0.5" style={{ fontSize: '0.75rem' }}>{act.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 신고 버튼 (F-31) */}
                  <div className="px-5 pb-4 pt-0">
                    <button
                      onClick={() => openReport(senior)}
                      className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-2xl border"
                      style={{ borderColor: '#FECACA', color: '#EF4444', fontWeight: 600 }}
                    >
                      <Flag className="w-3.5 h-3.5" /> 신고하기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 전체 활동 기록 다이얼로그 (F-29) */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md max-h-[80vh] overflow-y-auto border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: '#3DAF8A' }} />
              {selectedSenior?.name} 어르신 활동 기록
            </DialogTitle>
          </DialogHeader>

          {selectedSenior && selectedSenior.activities.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p style={{ fontSize: '0.9rem' }}>아직 활동 기록이 없습니다</p>
            </div>
          )}

          {selectedSenior && selectedSenior.activities.length > 0 && (
            <div className="space-y-3 mt-2">
              {/* 요약 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "전체 횟수", value: `${selectedSenior.activities.length}회` },
                  { label: "진행 완료", value: `${selectedSenior.activities.filter(a => a.done).length}회` },
                  { label: "누적 시간", value: `${selectedSenior.activities.filter(a => a.done).reduce((s, a) => s + (a.duration ?? 0), 0)}분` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: '#E8F8F5' }}>
                    <p className="font-bold text-gray-800" style={{ fontSize: '1rem' }}>{stat.value}</p>
                    <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.72rem' }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {selectedSenior.activities.map((act) => (
                <div key={act.id} className="rounded-2xl p-4" style={{ backgroundColor: '#FAF8F5', border: '1px solid #F3F4F6' }}>
                  <div className="flex items-center gap-2 mb-1">
                    {act.done
                      ? <CheckCircle className="w-4 h-4" style={{ color: '#3DAF8A' }} />
                      : <XCircle className="w-4 h-4 text-gray-300" />
                    }
                    <span className="font-semibold text-gray-800" style={{ fontSize: '0.88rem' }}>{act.date}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full ml-auto"
                      style={act.done
                        ? { backgroundColor: '#E8F8F5', color: '#3DAF8A', fontWeight: 600 }
                        : { backgroundColor: '#F3F4F6', color: '#9CA3AF', fontWeight: 600 }}
                    >
                      {act.done ? "진행 완료" : "진행 안됨"}
                    </span>
                  </div>
                  {act.done && (
                    <p className="text-gray-500 ml-6" style={{ fontSize: '0.82rem' }}>
                      {act.youthName} · {act.duration}분
                    </p>
                  )}
                  {act.note && (
                    <div className="mt-2 ml-6 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-300 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>{act.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* F-31 신고하기 다이얼로그 */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              {reportTarget?.name} 어르신 관련 신고
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

      {/* 활동 일지 전체보기 다이얼로그 */}
      <Dialog open={journalDialogOpen} onOpenChange={setJournalDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: '#3DAF8A' }} />
              청년 활동 일지
            </DialogTitle>
          </DialogHeader>

          {/* 연도 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {journalYears.map(y => (
              <button
                key={y}
                onClick={() => {
                  setJournalYear(y);
                  const firstMonth = [...new Set(JOURNALS.filter(j => j.year === y).map(j => j.month))][0];
                  setJournalMonth(firstMonth);
                }}
                className="px-4 py-1.5 rounded-full text-sm border-2 transition-colors flex-shrink-0 font-semibold"
                style={{
                  borderColor: journalYear === y ? '#3DAF8A' : '#E5E7EB',
                  backgroundColor: journalYear === y ? '#3DAF8A' : 'white',
                  color: journalYear === y ? 'white' : '#6B7280',
                }}
              >{y}년</button>
            ))}
          </div>

          {/* 월 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {monthsInYear.map(m => (
              <button
                key={m}
                onClick={() => setJournalMonth(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border-2 transition-colors flex-shrink-0"
                style={{
                  borderColor: journalMonth === m ? '#3DAF8A' : '#E5E7EB',
                  backgroundColor: journalMonth === m ? '#E8F8F5' : 'white',
                  color: journalMonth === m ? '#3DAF8A' : '#6B7280',
                  fontWeight: journalMonth === m ? 700 : 400,
                }}
              >
                {m}
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: journalMonth === m ? '#3DAF8A' : '#F3F4F6',
                    color: journalMonth === m ? 'white' : '#9CA3AF',
                    fontWeight: 700,
                  }}
                >
                  {JOURNALS.filter(j => j.year === journalYear && j.month === m).length}
                </span>
              </button>
            ))}
          </div>

          {/* 해당 월 일지 목록 */}
          <div className="overflow-y-auto space-y-3" style={{ maxHeight: '50vh' }}>
            {filteredJournals.length === 0 ? (
              <div className="py-8 text-center text-gray-400" style={{ fontSize: '0.9rem' }}>이 달에 작성된 일지가 없어요</div>
            ) : (
              filteredJournals.map((j, idx) => (
                <div key={idx} className="rounded-2xl p-4" style={{ backgroundColor: '#FAF8F5', border: '1px solid #F3F4F6' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>🧑</div>
                    <div>
                      <p className="font-semibold text-gray-900" style={{ fontSize: '0.85rem' }}>{j.youth} 청년</p>
                      <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>{j.date} · {j.duration} · {j.type}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed" style={{ fontSize: '0.83rem' }}>{j.content}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={logoutConfirm}
        title="로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        confirmColor="#3DAF8A"
        onConfirm={() => navigate("/")}
        onCancel={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
