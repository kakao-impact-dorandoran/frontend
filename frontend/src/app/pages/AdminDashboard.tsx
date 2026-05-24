import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Heart, LayoutDashboard, UserCheck, ShieldOff, GitMerge,
  Flag, Award, Tablet, LogOut, Users, Clock, AlertTriangle,
  CheckCircle, XCircle, Ban, ChevronRight, Search, Download, Truck
} from "lucide-react";
import { toast } from "sonner";

type MenuKey = "dashboard" | "reviews" | "users" | "matchings" | "reports" | "certificates" | "devices";

// ---- 더미 데이터 ----
const pendingYouths = [
  { id: "Y001", name: "이서연", email: "seoyeon@mail.com", phone: "010-1234-5678", keywords: ["차분한", "이야기를 잘 듣는"], greeting: "안녕하세요, 어르신과 따뜻하게 이야기 나누고 싶어요!", appliedAt: "2026-05-20", status: "PENDING" },
  { id: "Y002", name: "박민수", email: "minsoo@mail.com", phone: "010-9876-5432", keywords: ["유머러스한", "음악을 좋아하는"], greeting: "음악과 함께 즐거운 시간 보내요~", appliedAt: "2026-05-21", status: "PENDING" },
  { id: "Y003", name: "최지은", email: "jieun@mail.com", phone: "010-5555-7777", keywords: ["따뜻한", "공감을 잘하는"], greeting: "진심으로 경청하고 공감하겠습니다.", appliedAt: "2026-05-22", status: "PENDING" },
];

const allUsers = [
  { id: "Y001", name: "이서연", role: "청년", email: "seoyeon@mail.com", status: "APPROVED", reportCount: 0 },
  { id: "Y004", name: "김도현", role: "청년", email: "dohyun@mail.com", status: "APPROVED", reportCount: 2 },
  { id: "Y005", name: "한상우", role: "청년", email: "sangwoo@mail.com", status: "APPROVED", reportCount: 5 },
  { id: "G001", name: "최보호", role: "보호자", email: "guardian@mail.com", status: "APPROVED", reportCount: 0 },
];

const matchings = [
  { id: "M001", youth: "김민준", senior: "박순자 어르신", status: "IN_PROGRESS", startDate: "2026-04-15", totalTalks: 8, lastTalk: "2026-05-20" },
  { id: "M002", youth: "이서연", senior: "김복례 어르신", status: "MATCHED", startDate: "2026-05-18", totalTalks: 1, lastTalk: "2026-05-19" },
  { id: "M003", youth: "박민수", senior: "이영희 어르신", status: "ENDED", startDate: "2026-03-01", totalTalks: 15, lastTalk: "2026-04-30" },
  { id: "M004", youth: "최지은", senior: "최명자 어르신", status: "IN_PROGRESS", startDate: "2026-05-01", totalTalks: 5, lastTalk: "2026-05-21" },
];

const reports = [
  { id: "R001", type: "신고", reporter: "김민준(청년)", target: "박순자 어르신", reason: "부적절한 언행", reportedAt: "2026-05-19", status: "PENDING" },
  { id: "R002", type: "매칭 중단 요청", reporter: "최지은(청년)", target: "최명자 어르신", reason: "성향 불일치 — 대화 주제가 맞지 않습니다.", reportedAt: "2026-05-22", status: "PENDING" },
  { id: "R003", type: "신고", reporter: "이보호(보호자)", target: "이서연(청년)", reason: "통화 중 부적절한 발언", reportedAt: "2026-05-21", status: "RESOLVED" },
];

const certificates = [
  { id: "DRDR-2026-0001", youth: "김민준", totalMinutes: 640, issuedAt: "2026-05-01", hours: 10 },
  { id: "DRDR-2026-0002", youth: "최지은", totalMinutes: 720, issuedAt: "2026-05-15", hours: 12 },
];

const youthCertStatus = [
  { name: "김민준", totalMinutes: 640, issued: true, serial: "DRDR-2026-0001" },
  { name: "이서연", totalMinutes: 120, issued: false, serial: null },
  { name: "박민수", totalMinutes: 380, issued: false, serial: null },
  { name: "최지은", totalMinutes: 720, issued: true, serial: "DRDR-2026-0002" },
];

const devices = [
  { id: "DEV-001", senior: "박순자 어르신", guardian: "박보호", address: "서울 강남구", status: "DELIVERED", linked: true, deliveredAt: "2026-04-10" },
  { id: "DEV-002", senior: "김복례 어르신", guardian: "김보호", address: "서울 마포구", status: "SHIPPING", linked: false, deliveredAt: null },
  { id: "DEV-003", senior: "이영희 어르신", guardian: "이보호", address: "경기 분당구", status: "READY", linked: false, deliveredAt: null },
  { id: "DEV-004", senior: "최명자 어르신", guardian: "최보호", address: "서울 종로구", status: "DELIVERED", linked: true, deliveredAt: "2026-05-01" },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: "대기",    color: "#FF8A3D", bg: "#FFF4E6" },
  APPROVED:    { label: "승인",    color: "#3DAF8A", bg: "#E8F8F5" },
  REJECTED:    { label: "반려",    color: "#EF4444", bg: "#FEF2F2" },
  SUSPENDED:   { label: "제재",    color: "#6B7280", bg: "#F3F4F6" },
  IN_PROGRESS: { label: "진행중", color: "#3D7AFF", bg: "#EBF4FF" },
  MATCHED:     { label: "매칭됨", color: "#FF8A3D", bg: "#FFF4E6" },
  ENDED:       { label: "종료",   color: "#9CA3AF", bg: "#F9FAFB" },
  RESOLVED:    { label: "해결됨", color: "#3DAF8A", bg: "#E8F8F5" },
  READY:       { label: "배송 준비", color: "#9CA3AF", bg: "#F3F4F6" },
  SHIPPING:    { label: "배송 중", color: "#3D7AFF", bg: "#EBF4FF" },
  DELIVERED:   { label: "배송 완료", color: "#3DAF8A", bg: "#E8F8F5" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

const MENU_ITEMS: { key: MenuKey; label: string; icon: React.ReactNode; count?: number }[] = [
  { key: "dashboard",    label: "대시보드",      icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "reviews",      label: "청년 가입 검수", icon: <UserCheck className="w-4 h-4" />, count: pendingYouths.length },
  { key: "users",        label: "제재 관리",      icon: <ShieldOff className="w-4 h-4" /> },
  { key: "matchings",    label: "매칭 관리",      icon: <GitMerge className="w-4 h-4" /> },
  { key: "reports",      label: "신고 처리",      icon: <Flag className="w-4 h-4" />, count: reports.filter(r => r.status === "PENDING").length },
  { key: "certificates", label: "증명서 발급 현황", icon: <Award className="w-4 h-4" /> },
  { key: "devices",      label: "기기 상태 관리", icon: <Tablet className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const [active, setActive] = useState<MenuKey>("dashboard");
  const [youths, setYouths] = useState(pendingYouths);
  const [users, setUsers] = useState(allUsers);
  const [reportList, setReportList] = useState(reports);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedYouth, setSelectedYouth] = useState<typeof pendingYouths[0] | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<typeof allUsers[0] | null>(null);
  const [banReason, setBanReason] = useState("");

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);
  const [reportMemo, setReportMemo] = useState("");

  const [searchUser, setSearchUser] = useState("");

  const handleApprove = (id: string) => {
    setYouths(prev => prev.map(y => y.id === id ? { ...y, status: "APPROVED" } : y));
    toast.success("승인 처리되었습니다.");
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { toast.error("반려 사유를 입력해주세요."); return; }
    setYouths(prev => prev.map(y => y.id === selectedYouth?.id ? { ...y, status: "REJECTED" } : y));
    toast.info("반려 처리되었습니다.");
    setReviewDialogOpen(false);
    setRejectReason("");
  };

  const handleBan = () => {
    if (!banReason.trim()) { toast.error("제재 사유를 입력해주세요."); return; }
    setUsers(prev => prev.map(u => u.id === banTarget?.id ? { ...u, status: "SUSPENDED" } : u));
    toast.success("계정이 제재되었습니다.");
    setBanDialogOpen(false);
    setBanReason("");
  };

  const handleResolveReport = (id: string, result: "RESOLVED" | "REJECTED") => {
    setReportList(prev => prev.map(r => r.id === id ? { ...r, status: result } : r));
    toast.success(result === "RESOLVED" ? "신고가 해결 처리되었습니다." : "신고가 반려되었습니다.");
    setReportDialogOpen(false);
    setReportMemo("");
  };

  const filteredUsers = users.filter(u =>
    u.name.includes(searchUser) || u.email.includes(searchUser)
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 px-5 mb-8">
          <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
          <span className="font-bold text-gray-900">도란도란</span>
        </Link>
        <p className="px-5 text-xs text-gray-400 mb-3 uppercase tracking-wider">관리자</p>
        <nav className="flex-1 space-y-0.5 px-3">
          {MENU_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors text-left"
              style={{
                backgroundColor: active === item.key ? '#FFF4E6' : undefined,
                color: active === item.key ? '#FF8A3D' : '#6B7280',
                fontWeight: active === item.key ? 600 : 400,
              }}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold">{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 mt-4">
          <Link to="/login">
            <Button variant="ghost" className="w-full justify-start gap-2 rounded-2xl text-gray-500 text-sm">
              <LogOut className="w-4 h-4" /> 로그아웃
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">

          {/* ===== DASHBOARD ===== */}
          {active === "dashboard" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">운영 현황 대시보드</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "승인 대기 청년", value: pendingYouths.filter(y => y.status === "PENDING").length, icon: <Clock className="w-6 h-6" />, color: "#FF8A3D", bg: "#FFF4E6" },
                  { label: "미처리 신고/요청", value: reports.filter(r => r.status === "PENDING").length, icon: <AlertTriangle className="w-6 h-6" />, color: "#EF4444", bg: "#FEF2F2" },
                  { label: "활동 중 청년", value: 12, icon: <Users className="w-6 h-6" />, color: "#3DAF8A", bg: "#E8F8F5" },
                  { label: "진행 중 매칭", value: matchings.filter(m => m.status === "IN_PROGRESS").length, icon: <GitMerge className="w-6 h-6" />, color: "#3D7AFF", bg: "#EBF4FF" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* 승인 대기 목록 미리보기 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">최근 승인 대기 청년</h2>
                  <button onClick={() => setActive("reviews")} className="text-sm flex items-center gap-1" style={{ color: '#FF8A3D' }}>
                    전체 보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingYouths.slice(0, 2).map(y => (
                    <div key={y.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{y.name}</p>
                        <p className="text-xs text-gray-400">{y.email} · {y.appliedAt} 가입</p>
                      </div>
                      <StatusBadge status={y.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 최근 신고 미리보기 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">최근 신고/요청</h2>
                  <button onClick={() => setActive("reports")} className="text-sm flex items-center gap-1" style={{ color: '#FF8A3D' }}>
                    전체 보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {reports.slice(0, 2).map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{r.type} — {r.reporter}</p>
                        <p className="text-xs text-gray-400">{r.reason.slice(0, 30)}...</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== REVIEWS (청년 가입 검수) ===== */}
          {active === "reviews" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">청년 가입 검수</h1>
              <div className="space-y-4">
                {youths.map(y => (
                  <div key={y.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{y.name}</span>
                          <StatusBadge status={y.status} />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{y.email} · {y.phone}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {y.keywords.map(kw => (
                            <Badge key={kw} variant="secondary" className="text-xs rounded-full">#{kw}</Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 italic">"{y.greeting}"</p>
                        <p className="text-xs text-gray-400 mt-1">가입일: {y.appliedAt}</p>
                      </div>
                      {y.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="ml-4 rounded-xl shrink-0"
                          style={{ backgroundColor: '#FF8A3D' }}
                          onClick={() => { setSelectedYouth(y); setReviewDialogOpen(true); }}
                        >
                          검토하기
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== USERS (제재 관리) ===== */}
          {active === "users" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">악성 유저 제재 관리</h1>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="이름 또는 이메일 검색"
                  className="border-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{u.name}</span>
                          <Badge variant="outline" className="text-xs rounded-full">{u.role}</Badge>
                          <StatusBadge status={u.status} />
                        </div>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        {u.reportCount > 0 && (
                          <p className="text-xs text-red-500 mt-1">신고 {u.reportCount}건 누적</p>
                        )}
                      </div>
                      {u.status !== "SUSPENDED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                          onClick={() => { setBanTarget(u); setBanDialogOpen(true); }}
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" /> 제재
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: "APPROVED" } : x));
                            toast.success("제재가 해제되었습니다.");
                          }}
                        >
                          제재 해제
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== MATCHINGS ===== */}
          {active === "matchings" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">매칭 관리</h1>
              <div className="space-y-3">
                {matchings.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{m.youth}</span>
                        <span className="text-gray-400 text-sm">←→</span>
                        <span className="font-bold text-gray-900">{m.senior}</span>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>매칭 ID: {m.id}</span>
                      <span>시작: {m.startDate}</span>
                      <span>총 {m.totalTalks}회 대화</span>
                      <span>마지막: {m.lastTalk}</span>
                    </div>
                    {m.status !== "ENDED" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-gray-500 text-xs"
                          onClick={() => toast.info("매칭이 종료 처리되었습니다.")}
                        >
                          매칭 종료
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== REPORTS ===== */}
          {active === "reports" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">신고 및 중단 요청 처리</h1>
              <div className="space-y-4">
                {reportList.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs rounded-full">{r.type}</Badge>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-0.5">신고자: {r.reporter} → 대상: {r.target}</p>
                        <p className="text-sm text-gray-600">{r.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">{r.reportedAt}</p>
                      </div>
                      {r.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="ml-4 rounded-xl shrink-0"
                          style={{ backgroundColor: '#FF8A3D' }}
                          onClick={() => { setSelectedReport(r); setReportDialogOpen(true); }}
                        >
                          처리하기
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== CERTIFICATES ===== */}
          {active === "certificates" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">증명서 발급 현황</h1>
              <p className="text-sm text-gray-500 mb-6">누적 활동 10시간(600분) 이상 시 증명서 발급 가능</p>

              {/* 발급 내역 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
                <h2 className="font-bold text-gray-900 mb-4">청년별 활동 현황</h2>
                <div className="space-y-3">
                  {youthCertStatus.map(y => (
                    <div key={y.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{y.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-32">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min((y.totalMinutes / 600) * 100, 100)}%`,
                                backgroundColor: y.totalMinutes >= 600 ? '#3DAF8A' : '#FF8A3D'
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{Math.floor(y.totalMinutes / 60)}시간 {y.totalMinutes % 60}분</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        {y.issued ? (
                          <div>
                            <p className="text-xs text-green-600 font-medium">발급 완료</p>
                            <p className="text-xs text-gray-400">{y.serial}</p>
                          </div>
                        ) : y.totalMinutes >= 600 ? (
                          <Button
                            size="sm"
                            className="rounded-xl text-xs"
                            style={{ backgroundColor: '#3DAF8A' }}
                            onClick={() => toast.success(`${y.name}의 증명서가 발급되었습니다.`)}
                          >
                            <Download className="w-3 h-3 mr-1" /> 발급
                          </Button>
                        ) : (
                          <p className="text-xs text-gray-400">기준 미달</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 발급 이력 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">발급 이력</h2>
                <div className="space-y-3">
                  {certificates.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{c.youth}</p>
                        <p className="text-xs text-gray-400">{c.id} · 발급일: {c.issuedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#3DAF8A' }}>{c.hours}시간</p>
                        <Button size="sm" variant="ghost" className="text-xs h-6 px-2 rounded-lg">PDF 다운로드</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== DEVICES ===== */}
          {active === "devices" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">기기 상태 관리</h1>
              <div className="grid gap-4">
                {devices.map(d => (
                  <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Tablet className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-gray-900">{d.senior}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-sm text-gray-500">보호자: {d.guardian} · {d.address}</p>
                        <p className="text-xs text-gray-400 mt-1">기기 ID: {d.id}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{
                            backgroundColor: d.linked ? '#E8F8F5' : '#F3F4F6',
                            color: d.linked ? '#3DAF8A' : '#9CA3AF'
                          }}
                        >
                          {d.linked ? '연동 완료' : '미연동'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {d.status === "DELIVERED" && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> 배송 완료 {d.deliveredAt}</span>}
                      {d.status === "SHIPPING" && <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-500" /> 배송 진행 중</span>}
                      {d.status === "READY" && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> 배송 준비 중</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 청년 검수 다이얼로그 */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{selectedYouth?.name} 프로필 검토</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: '#FAF8F5' }}>
              <p className="text-sm text-gray-500 mb-1">이메일 · 연락처</p>
              <p className="text-sm font-medium text-gray-900">{selectedYouth?.email}</p>
              <p className="text-sm font-medium text-gray-900">{selectedYouth?.phone}</p>
              <p className="text-sm text-gray-500 mt-2 mb-1">인사말</p>
              <p className="text-sm text-gray-700 italic">"{selectedYouth?.greeting}"</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">반려 사유 (반려 시 필수)</p>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="반려 사유를 작성해주세요..."
                className="rounded-2xl resize-none text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl border-red-200 text-red-500 hover:bg-red-50"
                onClick={handleReject}
              >
                <XCircle className="w-4 h-4 mr-1" /> 반려
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                style={{ backgroundColor: '#3DAF8A' }}
                onClick={() => handleApprove(selectedYouth!.id)}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> 승인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 제재 다이얼로그 */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{banTarget?.name} 계정 제재</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              계정을 <strong className="text-red-500">SUSPENDED</strong> 상태로 변경하여 즉시 로그인을 차단합니다.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">제재 사유 <span className="text-red-400">*필수</span></p>
              <Textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="제재 사유를 작성해주세요..."
                className="rounded-2xl resize-none text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setBanDialogOpen(false)}>취소</Button>
              <Button className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 text-white" onClick={handleBan}>
                <Ban className="w-4 h-4 mr-1" /> 제재 확정
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 신고 처리 다이얼로그 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{selectedReport?.type} 처리</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: '#FAF8F5' }}>
              <p className="text-sm text-gray-600">{selectedReport?.reason}</p>
              <p className="text-xs text-gray-400 mt-2">신고자: {selectedReport?.reporter}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">관리자 메모 (선택)</p>
              <Textarea
                value={reportMemo}
                onChange={e => setReportMemo(e.target.value)}
                placeholder="처리 내용을 기록하세요..."
                className="rounded-2xl resize-none text-sm"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => handleResolveReport(selectedReport!.id, "REJECTED")}
              >
                반려
              </Button>
              <Button
                className="flex-1 rounded-2xl"
                style={{ backgroundColor: '#3DAF8A' }}
                onClick={() => handleResolveReport(selectedReport!.id, "RESOLVED")}
              >
                해결됨
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
