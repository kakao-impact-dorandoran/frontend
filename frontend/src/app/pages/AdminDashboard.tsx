import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Heart, LayoutDashboard, UserCheck, ShieldOff, GitMerge,
  Flag, Award, Tablet, LogOut, Users, Clock, AlertTriangle,
  CheckCircle, XCircle, Ban, ChevronRight, Search, Download, Truck,
  Loader2, RefreshCw, LifeBuoy, OctagonX,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApiError } from "../../lib/api/client";
import {
  getAdminHelpRequests,
  getAdminMatchTerminationRequests,
  processAdminHelpRequest,
  processAdminMatchTerminationRequest,
} from "../../lib/api/admin";
import {
  getAdminReports,
  processAdminReport,
} from "../../lib/api/report";
import type {
  AdminHelpRequestResponse,
  AdminMatchTerminationResponse,
  AdminReportResponse,
  HelpRequestType,
  ReportType,
} from "../../types/api";
import { ErrorCode } from "../../types/api";

type MenuKey =
  | "dashboard"
  | "reviews"
  | "users"
  | "matchings"
  | "operations"
  | "certificates"
  | "devices";

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
  HANDLED:     { label: "처리됨",  color: "#3DAF8A", bg: "#E8F8F5" },
  REQUESTED:   { label: "대기",    color: "#FF8A3D", bg: "#FFF4E6" },
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

const HELP_REQUEST_TYPE_LABEL: Record<HelpRequestType, string> = {
  DEVICE_HELP: "기기 사용 도움",
  EMERGENCY:   "긴급 도움",
  ETC:         "기타 문의",
};

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  INAPPROPRIATE_LANGUAGE: "부적절한 언행",
  HARASSMENT:             "괴롭힘",
  NO_SHOW:                "약속 불이행",
  DEVICE_PROBLEM:         "기기 문제",
  ETC:                    "기타",
};

const ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatLocalDateTime(value: string | null): string {
  if (!value) return "-";
  const [date = "", rest = ""] = value.split("T");
  const [y, m, d] = date.split("-").map((n) => Number(n));
  const [hh, mm] = rest.slice(0, 5).split(":").map((n) => Number(n));
  if (!y || !m || !d) return value;
  return ADMIN_DATE_FORMATTER.format(new Date(y, m - 1, d, hh || 0, mm || 0));
}

function resolveHelpListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    return err.message || "도움 요청 목록을 불러오지 못했습니다.";
  }
  return "도움 요청 목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveTerminationListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    return err.message || "매칭 중단 요청 목록을 불러오지 못했습니다.";
  }
  return "매칭 중단 요청 목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveHelpProcessError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.HELP_REQUEST_NOT_FOUND:
        return "도움 요청을 찾을 수 없습니다.";
      case ErrorCode.HELP_REQUEST_ALREADY_HANDLED:
        return "이미 처리된 도움 요청입니다.";
      case ErrorCode.INVALID_HELP_REQUEST_STATUS:
        return "잘못된 처리 상태입니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    if (err.status === 404) return "도움 요청을 찾을 수 없습니다.";
    if (err.status === 409) return "이미 처리된 도움 요청입니다.";
    return err.message || "도움 요청 처리에 실패했습니다.";
  }
  return "도움 요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveTerminationProcessError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.MATCH_TERMINATION_REQUEST_NOT_FOUND:
        return "매칭 중단 요청을 찾을 수 없습니다.";
      case ErrorCode.INVALID_MATCH_TERMINATION_STATUS:
        return "이미 처리된 중단 요청입니다.";
      case ErrorCode.MATCH_TERMINATION_ACCESS_DENIED:
        return "관리자 권한이 필요합니다.";
      case ErrorCode.MATCH_ALREADY_ENDED:
        return "이미 종료된 매칭입니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    if (err.status === 404) return "매칭 중단 요청을 찾을 수 없습니다.";
    if (err.status === 409) return "이미 처리된 중단 요청입니다.";
    return err.message || "매칭 중단 요청 처리에 실패했습니다.";
  }
  return "매칭 중단 요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveReportListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    return err.message || "신고 목록을 불러오지 못했습니다.";
  }
  return "신고 목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveReportProcessError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.REPORT_NOT_FOUND:
        return "신고를 찾을 수 없습니다.";
      case ErrorCode.INVALID_REPORT_STATUS:
        return "이미 처리된 신고입니다.";
      case ErrorCode.REPORT_ACCESS_DENIED:
        return "관리자 권한이 필요합니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return "관리자 권한이 필요합니다.";
    if (err.status === 404) return "신고를 찾을 수 없습니다.";
    if (err.status === 400 || err.status === 409) return "이미 처리된 신고입니다.";
    return err.message || "신고 처리에 실패했습니다.";
  }
  return "신고 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

const ADMIN_MEMO_MAX = 500;

export default function AdminDashboard() {
  const [active, setActive] = useState<MenuKey>("dashboard");
  const [youths, setYouths] = useState(pendingYouths);
  const [users, setUsers] = useState(allUsers);

  const [helpRequests, setHelpRequests] = useState<AdminHelpRequestResponse[]>([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [helpProcessingId, setHelpProcessingId] = useState<string | null>(null);
  const [helpConfirmTarget, setHelpConfirmTarget] =
    useState<AdminHelpRequestResponse | null>(null);

  const [terminationRequests, setTerminationRequests] =
    useState<AdminMatchTerminationResponse[]>([]);
  const [terminationLoading, setTerminationLoading] = useState(false);
  const [terminationError, setTerminationError] = useState<string | null>(null);
  const [terminationProcessingId, setTerminationProcessingId] =
    useState<string | null>(null);
  const [terminationDecisionTarget, setTerminationDecisionTarget] = useState<{
    request: AdminMatchTerminationResponse;
    decision: "APPROVED" | "REJECTED";
  } | null>(null);
  const [terminationMemo, setTerminationMemo] = useState("");

  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportProcessingId, setReportProcessingId] = useState<string | null>(null);
  const [reportDecisionTarget, setReportDecisionTarget] = useState<{
    report: AdminReportResponse;
    decision: "RESOLVED" | "REJECTED";
  } | null>(null);
  const [reportMemo, setReportMemo] = useState("");

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedYouth, setSelectedYouth] = useState<typeof pendingYouths[0] | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<typeof allUsers[0] | null>(null);
  const [banReason, setBanReason] = useState("");

  const [searchUser, setSearchUser] = useState("");

  const loadHelpRequests = useCallback(async () => {
    setHelpLoading(true);
    setHelpError(null);
    try {
      const list = await getAdminHelpRequests("PENDING");
      setHelpRequests(list ?? []);
    } catch (err) {
      setHelpRequests([]);
      setHelpError(resolveHelpListError(err));
    } finally {
      setHelpLoading(false);
    }
  }, []);

  const loadTerminationRequests = useCallback(async () => {
    setTerminationLoading(true);
    setTerminationError(null);
    try {
      const list = await getAdminMatchTerminationRequests("REQUESTED");
      setTerminationRequests(list ?? []);
    } catch (err) {
      setTerminationRequests([]);
      setTerminationError(resolveTerminationListError(err));
    } finally {
      setTerminationLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const list = await getAdminReports("PENDING");
      setReports(list ?? []);
    } catch (err) {
      setReports([]);
      setReportError(resolveReportListError(err));
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHelpRequests();
    void loadTerminationRequests();
    void loadReports();
  }, [loadHelpRequests, loadTerminationRequests, loadReports]);

  const submitHelpRequestHandle = useCallback(
    async (target: AdminHelpRequestResponse) => {
      setHelpProcessingId(target.helpRequestId);
      try {
        await processAdminHelpRequest(target.helpRequestId, { status: "HANDLED" });
        toast.success("도움 요청이 처리되었습니다.");
        setHelpConfirmTarget(null);
        await loadHelpRequests();
      } catch (err) {
        toast.error(resolveHelpProcessError(err));
      } finally {
        setHelpProcessingId(null);
      }
    },
    [loadHelpRequests],
  );

  const openTerminationDecision = (
    request: AdminMatchTerminationResponse,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setTerminationDecisionTarget({ request, decision });
    setTerminationMemo("");
  };

  const closeTerminationDecision = () => {
    setTerminationDecisionTarget(null);
    setTerminationMemo("");
  };

  const submitTerminationDecision = useCallback(async () => {
    if (!terminationDecisionTarget) return;
    const { request, decision } = terminationDecisionTarget;
    if (decision === "REJECTED" && !terminationMemo.trim()) {
      toast.error("반려 사유를 입력해 주세요.");
      return;
    }
    const memo = terminationMemo.trim();
    setTerminationProcessingId(request.requestId);
    try {
      await processAdminMatchTerminationRequest(request.requestId, {
        status: decision,
        adminMemo: memo.length > 0 ? memo : null,
      });
      toast.success(
        decision === "APPROVED"
          ? "중단 요청이 승인되어 매칭이 종료되었습니다."
          : "중단 요청이 반려되었습니다.",
      );
      closeTerminationDecision();
      await loadTerminationRequests();
    } catch (err) {
      toast.error(resolveTerminationProcessError(err));
    } finally {
      setTerminationProcessingId(null);
    }
  }, [terminationDecisionTarget, terminationMemo, loadTerminationRequests]);

  const openReportDecision = (
    report: AdminReportResponse,
    decision: "RESOLVED" | "REJECTED",
  ) => {
    setReportDecisionTarget({ report, decision });
    setReportMemo("");
  };

  const closeReportDecision = () => {
    setReportDecisionTarget(null);
    setReportMemo("");
  };

  const submitReportDecision = useCallback(async () => {
    if (!reportDecisionTarget) return;
    const { report, decision } = reportDecisionTarget;
    if (decision === "REJECTED" && !reportMemo.trim()) {
      toast.error("반려 사유를 입력해 주세요.");
      return;
    }
    const memo = reportMemo.trim();
    setReportProcessingId(report.reportId);
    try {
      await processAdminReport(report.reportId, {
        status: decision,
        adminMemo: memo.length > 0 ? memo : null,
      });
      toast.success(
        decision === "RESOLVED"
          ? "신고가 해결됨으로 처리되었습니다."
          : "신고가 반려 처리되었습니다.",
      );
      closeReportDecision();
      await loadReports();
    } catch (err) {
      toast.error(resolveReportProcessError(err));
    } finally {
      setReportProcessingId(null);
    }
  }, [reportDecisionTarget, reportMemo, loadReports]);

  const handleApprove = (id: string) => {
    setYouths((prev) => prev.map((y) => (y.id === id ? { ...y, status: "APPROVED" } : y)));
    toast.message("청년 가입 검수는 다음 단계에서 연결 예정입니다.");
    setReviewDialogOpen(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("반려 사유를 입력해주세요.");
      return;
    }
    setYouths((prev) =>
      prev.map((y) => (y.id === selectedYouth?.id ? { ...y, status: "REJECTED" } : y)),
    );
    toast.message("청년 가입 검수는 다음 단계에서 연결 예정입니다.");
    setReviewDialogOpen(false);
    setRejectReason("");
  };

  const handleBan = () => {
    if (!banReason.trim()) {
      toast.error("제재 사유를 입력해주세요.");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === banTarget?.id ? { ...u, status: "SUSPENDED" } : u)),
    );
    toast.message("계정 제재는 다음 단계에서 연결 예정입니다.");
    setBanDialogOpen(false);
    setBanReason("");
  };

  const filteredUsers = users.filter((u) =>
    u.name.includes(searchUser) || u.email.includes(searchUser),
  );

  const pendingHelpCount = helpRequests.length;
  const pendingTerminationCount = terminationRequests.length;
  const pendingReportCount = reports.length;
  const pendingOpsCount =
    pendingHelpCount + pendingTerminationCount + pendingReportCount;

  const MENU_ITEMS: { key: MenuKey; label: string; icon: React.ReactNode; count?: number }[] = useMemo(
    () => [
      { key: "dashboard",    label: "대시보드",      icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: "reviews",      label: "청년 가입 검수", icon: <UserCheck className="w-4 h-4" />, count: pendingYouths.length },
      { key: "users",        label: "제재 관리",      icon: <ShieldOff className="w-4 h-4" /> },
      { key: "matchings",    label: "매칭 관리",      icon: <GitMerge className="w-4 h-4" /> },
      { key: "operations",   label: "운영 큐 처리",   icon: <Flag className="w-4 h-4" />, count: pendingOpsCount },
      { key: "certificates", label: "증명서 발급 현황", icon: <Award className="w-4 h-4" /> },
      { key: "devices",      label: "기기 상태 관리", icon: <Tablet className="w-4 h-4" /> },
    ],
    [pendingOpsCount],
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
          {MENU_ITEMS.map((item) => (
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
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#FFF4E6", color: "#FF8A3D" }}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{pendingYouths.filter((y) => y.status === "PENDING").length}</p>
                  <p className="text-xs text-gray-500">승인 대기 청년</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#FFF4E6", color: "#FF8A3D" }}>
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {helpLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : pendingHelpCount}
                  </p>
                  <p className="text-xs text-gray-500">대기 중 도움 요청</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                    <OctagonX className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {terminationLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : pendingTerminationCount}
                  </p>
                  <p className="text-xs text-gray-500">대기 중 매칭 중단 요청</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                    <Flag className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {reportLoading ? <Loader2 className="w-6 h-6 animate-spin text-gray-300" /> : pendingReportCount}
                  </p>
                  <p className="text-xs text-gray-500">대기 중 신고</p>
                </div>
              </div>

              {/* 운영 큐 요약 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">대기 중인 도움 요청</h2>
                    {helpLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                  <button
                    onClick={() => setActive("operations")}
                    className="text-sm flex items-center gap-1"
                    style={{ color: "#FF8A3D" }}
                  >
                    전체 보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {helpError ? (
                  <div className="text-sm text-red-500 py-4">
                    {helpError}
                    <button onClick={() => void loadHelpRequests()} className="ml-2 underline">다시 시도</button>
                  </div>
                ) : helpRequests.length === 0 && !helpLoading ? (
                  <p className="text-sm text-gray-400 py-4">대기 중인 도움 요청이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {helpRequests.slice(0, 3).map((r) => (
                      <div key={r.helpRequestId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {r.elderName} · {r.requestType ? HELP_REQUEST_TYPE_LABEL[r.requestType] : "유형 미지정"}
                          </p>
                          <p className="text-xs text-gray-400">{formatLocalDateTime(r.createdAt)}</p>
                        </div>
                        <StatusBadge status={r.handledStatus} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">대기 중인 매칭 중단 요청</h2>
                    {terminationLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                  <button
                    onClick={() => setActive("operations")}
                    className="text-sm flex items-center gap-1"
                    style={{ color: "#FF8A3D" }}
                  >
                    전체 보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {terminationError ? (
                  <div className="text-sm text-red-500 py-4">
                    {terminationError}
                    <button onClick={() => void loadTerminationRequests()} className="ml-2 underline">다시 시도</button>
                  </div>
                ) : terminationRequests.length === 0 && !terminationLoading ? (
                  <p className="text-sm text-gray-400 py-4">대기 중인 매칭 중단 요청이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {terminationRequests.slice(0, 3).map((r) => (
                      <div key={r.requestId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {r.youthName} ↔ {r.elderName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{r.reason}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatLocalDateTime(r.createdAt)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">대기 중인 신고</h2>
                    {reportLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                  <button
                    onClick={() => setActive("operations")}
                    className="text-sm flex items-center gap-1"
                    style={{ color: "#FF8A3D" }}
                  >
                    전체 보기 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {reportError ? (
                  <div className="text-sm text-red-500 py-4">
                    {reportError}
                    <button onClick={() => void loadReports()} className="ml-2 underline">다시 시도</button>
                  </div>
                ) : reports.length === 0 && !reportLoading ? (
                  <p className="text-sm text-gray-400 py-4">대기 중인 신고가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((r) => (
                      <div key={r.reportId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {r.reporterUserName ?? "익명"} → {r.targetUserName ?? r.targetElderName ?? "대상 미지정"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            [{REPORT_TYPE_LABEL[r.reportType]}] {r.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatLocalDateTime(r.createdAt)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== REVIEWS (청년 가입 검수) — mock 유지 ===== */}
          {active === "reviews" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">청년 가입 검수</h1>
              <p className="text-sm text-gray-400 mb-6">청년 프로필 승인/반려는 다음 단계에서 연결 예정입니다.</p>
              <div className="space-y-4">
                {youths.map((y) => (
                  <div key={y.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{y.name}</span>
                          <StatusBadge status={y.status} />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{y.email} · {y.phone}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {y.keywords.map((kw) => (
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

          {/* ===== USERS (제재 관리) — mock 유지 ===== */}
          {active === "users" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">악성 유저 제재 관리</h1>
              <p className="text-sm text-gray-400 mb-6">사용자 제재 API 연결은 다음 단계에서 진행됩니다.</p>
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="이름 또는 이메일 검색"
                  className="border-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>
              <div className="space-y-3">
                {filteredUsers.map((u) => (
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
                            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: "APPROVED" } : x)));
                            toast.message("계정 제재 해제는 다음 단계에서 연결 예정입니다.");
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

          {/* ===== MATCHINGS — mock 유지 ===== */}
          {active === "matchings" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">매칭 관리</h1>
              <p className="text-sm text-gray-400 mb-6">관리자 매칭 강제 종료 API 연결은 다음 단계에서 진행됩니다.</p>
              <div className="space-y-3">
                {matchings.map((m) => (
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== OPERATIONS (운영 큐 처리) — 실제 API 연동 ===== */}
          {active === "operations" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">운영 큐 처리</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    도움 요청과 매칭 중단 요청을 확인하고 처리합니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    void loadHelpRequests();
                    void loadTerminationRequests();
                    void loadReports();
                  }}
                  disabled={helpLoading || terminationLoading || reportLoading}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-1 ${
                      helpLoading || terminationLoading || reportLoading ? "animate-spin" : ""
                    }`}
                  />
                  새로고침
                </Button>
              </div>

              {/* 도움 요청 큐 */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-orange-500" />
                    <h2 className="font-bold text-gray-900">도움 요청 (PENDING)</h2>
                    <span className="text-xs text-gray-500">총 {pendingHelpCount}건</span>
                  </div>
                </div>
                {helpLoading ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중입니다...
                  </div>
                ) : helpError ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-red-500 mb-3">{helpError}</p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void loadHelpRequests()}>
                      다시 시도
                    </Button>
                  </div>
                ) : helpRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
                    대기 중인 도움 요청이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {helpRequests.map((r) => {
                      const processing = helpProcessingId === r.helpRequestId;
                      return (
                        <div key={r.helpRequestId} className="bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-900">{r.elderName}</span>
                                <Badge variant="outline" className="text-xs rounded-full">
                                  {r.requestType ? HELP_REQUEST_TYPE_LABEL[r.requestType] : "유형 미지정"}
                                </Badge>
                                <StatusBadge status={r.handledStatus} />
                              </div>
                              <p className="text-xs text-gray-400">
                                요청 시각: {formatLocalDateTime(r.createdAt)}
                              </p>
                              <p className="text-xs text-gray-400">
                                기기 ID: {r.deviceId ?? "없음"}
                              </p>
                              {r.deviceStatus && Object.keys(r.deviceStatus).length > 0 && (
                                <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mt-2 overflow-x-auto">
                                  {JSON.stringify(r.deviceStatus, null, 2)}
                                </pre>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl shrink-0"
                              style={{ backgroundColor: "#3DAF8A" }}
                              disabled={processing || r.handledStatus !== "PENDING"}
                              onClick={() => setHelpConfirmTarget(r)}
                            >
                              {processing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> 처리 완료
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 매칭 중단 요청 큐 */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <OctagonX className="w-4 h-4 text-red-500" />
                    <h2 className="font-bold text-gray-900">매칭 중단 요청 (REQUESTED)</h2>
                    <span className="text-xs text-gray-500">총 {pendingTerminationCount}건</span>
                  </div>
                </div>
                {terminationLoading ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중입니다...
                  </div>
                ) : terminationError ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-red-500 mb-3">{terminationError}</p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void loadTerminationRequests()}>
                      다시 시도
                    </Button>
                  </div>
                ) : terminationRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
                    대기 중인 매칭 중단 요청이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {terminationRequests.map((r) => {
                      const processing = terminationProcessingId === r.requestId;
                      return (
                        <div key={r.requestId} className="bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-900">{r.youthName}</span>
                                <span className="text-gray-400 text-sm">↔</span>
                                <span className="font-bold text-gray-900">{r.elderName}</span>
                                <StatusBadge status={r.status} />
                              </div>
                              <p className="text-xs text-gray-400">
                                요청자: {r.requesterUserName ?? "알 수 없음"}
                                {" · "}
                                요청 시각: {formatLocalDateTime(r.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">요청 사유</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {r.reason}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                              disabled={processing || r.status !== "REQUESTED"}
                              onClick={() => openTerminationDecision(r, "REJECTED")}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> 반려
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl text-white"
                              style={{ backgroundColor: "#3DAF8A" }}
                              disabled={processing || r.status !== "REQUESTED"}
                              onClick={() => openTerminationDecision(r, "APPROVED")}
                            >
                              {processing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> 승인
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 신고 큐 (FE-5J) */}
              <section className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    <h2 className="font-bold text-gray-900">신고 (PENDING)</h2>
                    <span className="text-xs text-gray-500">총 {pendingReportCount}건</span>
                  </div>
                </div>
                {reportLoading ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중입니다...
                  </div>
                ) : reportError ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-red-500 mb-3">{reportError}</p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void loadReports()}>
                      다시 시도
                    </Button>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
                    대기 중인 신고가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => {
                      const processing = reportProcessingId === r.reportId;
                      return (
                        <div key={r.reportId} className="bg-white rounded-2xl p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-gray-900">
                                  {r.reporterUserName ?? "익명 신고자"}
                                </span>
                                <span className="text-gray-400 text-sm">→</span>
                                <span className="font-bold text-gray-900">
                                  {r.targetUserName ?? r.targetElderName ?? "대상 미지정"}
                                </span>
                                <Badge variant="outline" className="text-xs rounded-full">
                                  {REPORT_TYPE_LABEL[r.reportType]}
                                </Badge>
                                <StatusBadge status={r.status} />
                              </div>
                              <p className="text-xs text-gray-400">
                                매칭 ID: {r.matchId ? r.matchId.slice(0, 8) : "없음"}
                                {" · "}
                                신고 시각: {formatLocalDateTime(r.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">신고 내용</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {r.content}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                              disabled={processing || r.status !== "PENDING"}
                              onClick={() => openReportDecision(r, "REJECTED")}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> 반려
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 rounded-xl text-white"
                              style={{ backgroundColor: "#3DAF8A" }}
                              disabled={processing || r.status !== "PENDING"}
                              onClick={() => openReportDecision(r, "RESOLVED")}
                            >
                              {processing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> 해결됨
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ===== CERTIFICATES — mock 유지 ===== */}
          {active === "certificates" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">증명서 발급 현황</h1>
              <p className="text-sm text-gray-400 mb-6">증명서 API 연결은 다음 단계에서 진행됩니다.</p>

              <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
                <h2 className="font-bold text-gray-900 mb-4">청년별 활동 현황</h2>
                <div className="space-y-3">
                  {youthCertStatus.map((y) => (
                    <div key={y.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{y.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-32">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min((y.totalMinutes / 600) * 100, 100)}%`,
                                backgroundColor: y.totalMinutes >= 600 ? '#3DAF8A' : '#FF8A3D',
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
                            onClick={() => toast.message("증명서 발급은 다음 단계에서 연결 예정입니다.")}
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

              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4">발급 이력</h2>
                <div className="space-y-3">
                  {certificates.map((c) => (
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

          {/* ===== DEVICES — mock 유지 ===== */}
          {active === "devices" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">기기 상태 관리</h1>
              <p className="text-sm text-gray-400 mb-6">전용 기기 등록/배송/상태 관리 API 연결은 다음 단계에서 진행됩니다.</p>
              <div className="grid gap-4">
                {devices.map((d) => (
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
                            color: d.linked ? '#3DAF8A' : '#9CA3AF',
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
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toast.info("운영 미지원 알림")}
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> 운영자 알림
                  <AlertTriangle className="w-3.5 h-3.5 ml-1 text-orange-400" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 청년 검수 다이얼로그 (mock) */}
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
                onChange={(e) => setRejectReason(e.target.value)}
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

      {/* 제재 다이얼로그 (mock) */}
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
                onChange={(e) => setBanReason(e.target.value)}
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

      {/* 도움 요청 처리 확인 (실 API) */}
      <ConfirmDialog
        open={helpConfirmTarget !== null}
        title="도움 요청을 처리 완료로 표시할까요?"
        description={
          helpConfirmTarget
            ? `${helpConfirmTarget.elderName} · ${helpConfirmTarget.requestType ? HELP_REQUEST_TYPE_LABEL[helpConfirmTarget.requestType] : "유형 미지정"}`
            : undefined
        }
        confirmLabel="처리 완료"
        confirmColor="#3DAF8A"
        onConfirm={() => {
          if (helpConfirmTarget) void submitHelpRequestHandle(helpConfirmTarget);
        }}
        onCancel={() => {
          if (helpProcessingId) return;
          setHelpConfirmTarget(null);
        }}
      />

      {/* 매칭 중단 요청 승인/반려 다이얼로그 (실 API) */}
      <Dialog
        open={terminationDecisionTarget !== null}
        onOpenChange={(o) => {
          if (!o && !terminationProcessingId) closeTerminationDecision();
        }}
      >
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {terminationDecisionTarget?.decision === "APPROVED"
                ? "매칭 중단 요청 승인"
                : "매칭 중단 요청 반려"}
            </DialogTitle>
          </DialogHeader>
          {terminationDecisionTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl" style={{ backgroundColor: "#FAF8F5" }}>
                <p className="text-sm text-gray-700 font-medium">
                  {terminationDecisionTarget.request.youthName} ↔ {terminationDecisionTarget.request.elderName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  요청자: {terminationDecisionTarget.request.requesterUserName ?? "알 수 없음"}
                </p>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                  {terminationDecisionTarget.request.reason}
                </p>
              </div>
              {terminationDecisionTarget.decision === "APPROVED" && (
                <p className="text-xs text-gray-500">
                  승인 시 해당 매칭의 상태가 자동으로 <strong>ENDED</strong>로 변경됩니다.
                </p>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  관리자 메모{" "}
                  {terminationDecisionTarget.decision === "REJECTED" ? (
                    <span className="text-red-400">*필수</span>
                  ) : (
                    <span className="text-gray-400">(선택)</span>
                  )}
                </p>
                <Textarea
                  value={terminationMemo}
                  onChange={(e) => setTerminationMemo(e.target.value.slice(0, ADMIN_MEMO_MAX))}
                  placeholder={
                    terminationDecisionTarget.decision === "APPROVED"
                      ? "예: 보호자 의사 확인 완료"
                      : "반려 사유를 입력해 주세요"
                  }
                  className="rounded-2xl resize-none text-sm"
                  rows={3}
                  disabled={terminationProcessingId !== null}
                />
                <p className="text-xs text-gray-400 text-right">
                  {terminationMemo.length} / {ADMIN_MEMO_MAX}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={closeTerminationDecision}
                  disabled={terminationProcessingId !== null}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 rounded-2xl text-white"
                  style={{
                    backgroundColor:
                      terminationDecisionTarget.decision === "APPROVED" ? "#3DAF8A" : "#EF4444",
                  }}
                  onClick={submitTerminationDecision}
                  disabled={terminationProcessingId !== null}
                >
                  {terminationProcessingId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : terminationDecisionTarget.decision === "APPROVED" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" /> 승인
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" /> 반려
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 신고 처리 다이얼로그 (FE-5J) */}
      <Dialog
        open={reportDecisionTarget !== null}
        onOpenChange={(o) => {
          if (!o && !reportProcessingId) closeReportDecision();
        }}
      >
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {reportDecisionTarget?.decision === "RESOLVED"
                ? "신고 해결 처리"
                : "신고 반려 처리"}
            </DialogTitle>
          </DialogHeader>
          {reportDecisionTarget && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl" style={{ backgroundColor: "#FAF8F5" }}>
                <p className="text-sm text-gray-700 font-medium">
                  {reportDecisionTarget.report.reporterUserName ?? "익명 신고자"} →{" "}
                  {reportDecisionTarget.report.targetUserName ??
                    reportDecisionTarget.report.targetElderName ??
                    "대상 미지정"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  유형: {REPORT_TYPE_LABEL[reportDecisionTarget.report.reportType]}
                </p>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                  {reportDecisionTarget.report.content}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  관리자 메모{" "}
                  {reportDecisionTarget.decision === "REJECTED" ? (
                    <span className="text-red-400">*필수</span>
                  ) : (
                    <span className="text-gray-400">(선택)</span>
                  )}
                </p>
                <Textarea
                  value={reportMemo}
                  onChange={(e) => setReportMemo(e.target.value.slice(0, ADMIN_MEMO_MAX))}
                  placeholder={
                    reportDecisionTarget.decision === "RESOLVED"
                      ? "예: 양측 가이드 안내 완료"
                      : "반려 사유를 입력해 주세요"
                  }
                  className="rounded-2xl resize-none text-sm"
                  rows={3}
                  disabled={reportProcessingId !== null}
                />
                <p className="text-xs text-gray-400 text-right">
                  {reportMemo.length} / {ADMIN_MEMO_MAX}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={closeReportDecision}
                  disabled={reportProcessingId !== null}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 rounded-2xl text-white"
                  style={{
                    backgroundColor:
                      reportDecisionTarget.decision === "RESOLVED" ? "#3DAF8A" : "#EF4444",
                  }}
                  onClick={submitReportDecision}
                  disabled={reportProcessingId !== null}
                >
                  {reportProcessingId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : reportDecisionTarget.decision === "RESOLVED" ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" /> 해결됨
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" /> 반려
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
