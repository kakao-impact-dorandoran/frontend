import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Phone,
  Video,
  Calendar,
  User,
  AlertCircle,
  Flag,
  OctagonX,
  Loader2,
  RefreshCw,
  MessageCircle,
  Users,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { ApiError } from "../../lib/api/client";
import {
  createMatchTerminationRequest,
  getMatchDetail,
  getMyMatches,
} from "../../lib/api/matching";
import { createReport } from "../../lib/api/report";
import type {
  CallType,
  DifficultyLevel,
  MatchDetailResponse,
  MatchStatus,
  MatchSummaryResponse,
  ReportType,
} from "../../types/api";
import { ErrorCode } from "../../types/api";
import { Button } from "../components/ui/button";

const STATUS_LABEL: Record<MatchStatus, string> = {
  MATCHED: "매칭 중",
  IN_PROGRESS: "진행 중",
  TERMINATION_REQUESTED: "중단 요청 중",
  ENDED: "종료됨",
};

const STATUS_BADGE_STYLE: Record<MatchStatus, { color: string; backgroundColor: string }> = {
  MATCHED: { color: "#3DAF8A", backgroundColor: "#E8F8F5" },
  IN_PROGRESS: { color: "#3D7AFF", backgroundColor: "#EBF4FF" },
  TERMINATION_REQUESTED: { color: "#E6A817", backgroundColor: "#FFF9E6" },
  ENDED: { color: "#6B7280", backgroundColor: "#F3F4F6" },
};

const ACTIVE_STATUSES = new Set<MatchStatus>(["MATCHED", "IN_PROGRESS"]);

const CALL_TYPE_LABEL: Record<CallType, string> = {
  VIDEO: "화상 통화",
  AUDIO: "음성 통화",
};

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  LOW: "쉬움",
  MEDIUM: "보통",
  HIGH: "활발",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const mi = String(parsed.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function resolveListErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 필요합니다. 다시 로그인해주세요.";
    if (err.status === 403) {
      return err.message || "매칭 정보를 조회할 권한이 없습니다. 관리자 승인 여부를 확인해주세요.";
    }
    return err.message || "매칭 목록을 불러오지 못했습니다.";
  }
  return "매칭 목록을 불러오지 못했습니다. 네트워크 상태를 확인해주세요.";
}

function resolveTerminationRequestError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.MATCH_TERMINATION_ALREADY_REQUESTED:
        return "이미 중단 요청이 접수된 매칭입니다.";
      case ErrorCode.MATCH_TERMINATION_ACCESS_DENIED:
        return "이 매칭에 대한 중단 요청 권한이 없습니다.";
      case ErrorCode.MATCH_ALREADY_ENDED:
        return "이미 종료된 매칭입니다.";
      case ErrorCode.INVALID_INPUT:
        return "중단 요청 사유를 입력해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return err.message || "이 매칭에 대한 중단 요청 권한이 없습니다.";
    if (err.status === 404) return "매칭 정보를 찾을 수 없습니다.";
    return err.message || "매칭 중단 요청을 접수하지 못했습니다.";
  }
  return "매칭 중단 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

const TERMINATION_REASON_MAX = 500;
const REPORT_CONTENT_MAX = 500;

const REPORT_TYPE_OPTIONS: Array<{ value: ReportType; label: string }> = [
  { value: "INAPPROPRIATE_LANGUAGE", label: "부적절한 언행" },
  { value: "HARASSMENT",             label: "괴롭힘" },
  { value: "NO_SHOW",                label: "약속 불이행" },
  { value: "DEVICE_PROBLEM",         label: "기기 문제" },
  { value: "ETC",                    label: "기타" },
];

function resolveReportCreateError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.REPORT_ACCESS_DENIED:
        return "이 매칭에 대한 신고 권한이 없습니다.";
      case ErrorCode.MATCH_NOT_FOUND:
        return "매칭 정보를 찾을 수 없습니다.";
      case ErrorCode.INVALID_INPUT:
        return "신고 내용을 입력해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return err.message || "신고 권한이 없습니다.";
    if (err.status === 404) return "신고 대상을 찾을 수 없습니다.";
    return err.message || "신고를 접수하지 못했습니다.";
  }
  return "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveDetailErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 필요합니다. 다시 로그인해주세요.";
    if (err.status === 403) return err.message || "매칭 상세를 조회할 권한이 없습니다.";
    if (err.status === 404) return "매칭 정보를 찾을 수 없습니다.";
    return err.message || "매칭 상세를 불러오지 못했습니다.";
  }
  return "매칭 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const style = STATUS_BADGE_STYLE[status];
  return (
    <span
      className="px-3 py-1 text-xs rounded-full"
      style={{ ...style, fontWeight: 600 }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function YouthSeniors() {
  const [matches, setMatches] = useState<MatchSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [activeMatch, setActiveMatch] = useState<MatchSummaryResponse | null>(null);
  const [activeDetail, setActiveDetail] = useState<MatchDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [terminationTarget, setTerminationTarget] = useState<MatchSummaryResponse | null>(null);
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationSubmitting, setTerminationSubmitting] = useState(false);
  const [terminationError, setTerminationError] = useState<string | null>(null);

  const [reportTarget, setReportTarget] = useState<MatchSummaryResponse | null>(null);
  const [reportType, setReportType] = useState<ReportType>("INAPPROPRIATE_LANGUAGE");
  const [reportContent, setReportContent] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await getMyMatches();
      setMatches(data ?? []);
      setHasLoadedOnce(true);
    } catch (err) {
      setMatches([]);
      setError(resolveListErrorMessage(err));
    } finally {
      if (mode === "initial") setIsLoading(false);
      else setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMatches("initial");
  }, [fetchMatches]);

  const activeCount = useMemo(
    () => matches.filter((m) => ACTIVE_STATUSES.has(m.status)).length,
    [matches],
  );

  const openDetail = useCallback(async (match: MatchSummaryResponse) => {
    setActiveMatch(match);
    setActiveDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);
    try {
      const detail = await getMatchDetail(match.matchId);
      setActiveDetail(detail);
    } catch (err) {
      setDetailError(resolveDetailErrorMessage(err));
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setActiveMatch(null);
    setActiveDetail(null);
    setDetailError(null);
  };

  const retryDetail = () => {
    if (activeMatch) void openDetail(activeMatch);
  };

  const showPlaceholderToast = () => {
    toast.info("다음 단계에서 연결 예정입니다.");
  };

  const openReportDialog = useCallback((match: MatchSummaryResponse) => {
    setReportTarget(match);
    setReportType("INAPPROPRIATE_LANGUAGE");
    setReportContent("");
    setReportError(null);
    setReportSubmitting(false);
  }, []);

  const closeReportDialog = useCallback(() => {
    setReportTarget(null);
    setReportType("INAPPROPRIATE_LANGUAGE");
    setReportContent("");
    setReportError(null);
    setReportSubmitting(false);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!reportTarget) return;
    const content = reportContent.trim();
    if (!content) {
      setReportError("신고 내용을 입력해 주세요.");
      return;
    }
    setReportSubmitting(true);
    setReportError(null);
    try {
      await createReport({
        matchId: reportTarget.matchId,
        targetElderId: reportTarget.elderId,
        reportType,
        content,
      });
      toast.success("신고가 접수되었습니다.");
      closeReportDialog();
    } catch (err) {
      const message = resolveReportCreateError(err);
      setReportError(message);
      toast.error(message);
      setReportSubmitting(false);
    }
  }, [reportTarget, reportContent, reportType, closeReportDialog]);

  const refetchActiveDetail = useCallback(async (matchId: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getMatchDetail(matchId);
      setActiveDetail(detail);
    } catch (err) {
      setDetailError(resolveDetailErrorMessage(err));
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const openTerminationDialog = useCallback((match: MatchSummaryResponse) => {
    setTerminationTarget(match);
    setTerminationReason("");
    setTerminationError(null);
    setTerminationSubmitting(false);
  }, []);

  const closeTerminationDialog = useCallback(() => {
    setTerminationTarget(null);
    setTerminationReason("");
    setTerminationError(null);
    setTerminationSubmitting(false);
  }, []);

  const handleSubmitTermination = useCallback(async () => {
    if (!terminationTarget) return;
    const reason = terminationReason.trim();
    if (!reason) {
      setTerminationError("중단 요청 사유를 입력해 주세요.");
      return;
    }
    setTerminationSubmitting(true);
    setTerminationError(null);
    try {
      await createMatchTerminationRequest(terminationTarget.matchId, { reason });
      toast.success("매칭 중단 요청이 접수되었습니다.");
      const targetMatchId = terminationTarget.matchId;
      closeTerminationDialog();
      await fetchMatches("refresh");
      if (activeMatch && activeMatch.matchId === targetMatchId) {
        await refetchActiveDetail(targetMatchId);
      }
    } catch (err) {
      const message = resolveTerminationRequestError(err);
      setTerminationError(message);
      toast.error(message);
      setTerminationSubmitting(false);
    }
  }, [
    terminationTarget,
    terminationReason,
    closeTerminationDialog,
    fetchMatches,
    activeMatch,
    refetchActiveDetail,
  ]);

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
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-gray-500 mb-1" style={{ fontSize: '0.85rem' }}>현재 매칭</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A3D' }}>{activeCount}명의 어르신</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchMatches("refresh")}
              disabled={isLoading || isRefreshing}
              className="p-2.5 rounded-2xl border text-gray-500 disabled:opacity-50"
              style={{ borderColor: '#E5E7EB' }}
              aria-label="새로고침"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <Link to="/youth/matching">
              <button
                className="px-4 py-2.5 rounded-2xl border text-gray-700"
                style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.88rem' }}
              >
                새 매칭 찾기
              </button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: '#FF8A3D' }} />
            <p className="text-gray-500" style={{ fontSize: '0.9rem' }}>매칭 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEE2E2' }}>
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">목록을 불러오지 못했습니다</p>
            <p className="text-gray-500 mb-5" style={{ fontSize: '0.9rem' }}>{error}</p>
            <button
              onClick={() => void fetchMatches(hasLoadedOnce ? "refresh" : "initial")}
              className="px-6 py-2.5 rounded-2xl text-white inline-flex items-center gap-2"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.9rem' }}
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF4E6' }}>
              <Users className="w-8 h-8" style={{ color: '#FF8A3D' }} />
            </div>
            <p className="text-gray-700 font-semibold mb-1">아직 매칭된 어르신이 없습니다</p>
            <p className="text-gray-400 mb-4" style={{ fontSize: '0.85rem' }}>매칭 관리에서 어르신을 선택해보세요</p>
            <Link to="/youth/matching">
              <button className="px-6 py-2.5 rounded-2xl text-white" style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.9rem' }}>
                어르신 매칭하기
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((m) => {
              const isEnded = m.status === "ENDED";
              return (
                <div key={m.matchId} className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div>
                      <h3 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{m.elderName} 어르신</h3>
                      <p className="text-gray-500 mt-1" style={{ fontSize: '0.8rem' }}>
                        매칭번호 <span className="font-mono">{m.matchId.slice(0, 8)}</span>
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: '0.83rem' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>선택일 {formatDate(m.selectedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: '0.83rem' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>매칭일 {formatDate(m.matchedAt)}</span>
                    </div>
                    {m.endedAt && (
                      <div className="flex items-center gap-2 text-gray-500 col-span-2" style={{ fontSize: '0.83rem' }}>
                        <OctagonX className="w-3.5 h-3.5" />
                        <span>종료일 {formatDateTime(m.endedAt)}</span>
                      </div>
                    )}
                  </div>

                  {m.icebreakingMessage && (
                    <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#FAF8F5' }}>
                      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: '#FF8A3D' }}>
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>내가 보낸 사전 인사말</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {m.icebreakingMessage.length > 140
                          ? `${m.icebreakingMessage.slice(0, 140)}...`
                          : m.icebreakingMessage}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => void openDetail(m)}
                    className="w-full py-3 rounded-2xl text-white mb-2 inline-flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#FF8A3D', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    <Info className="w-4 h-4" />
                    상세 보기
                  </button>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={showPlaceholderToast}
                      disabled={isEnded}
                      className="py-2.5 rounded-2xl border inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ borderColor: '#E5E7EB', color: '#374151', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      연락하기
                    </button>
                    <button
                      onClick={showPlaceholderToast}
                      disabled={isEnded}
                      className="py-2.5 rounded-2xl border inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ borderColor: '#E5E7EB', color: '#374151', fontWeight: 600, fontSize: '0.85rem' }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      일정 잡기
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openReportDialog(m)}
                      disabled={isEnded}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs disabled:opacity-50"
                      style={{ borderColor: '#E5E7EB', color: '#EF4444', fontWeight: 600 }}
                    >
                      <Flag className="w-3.5 h-3.5" /> 신고하기
                    </button>
                    {m.status === "TERMINATION_REQUESTED" ? (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs opacity-70 cursor-not-allowed"
                        style={{ borderColor: '#FDE68A', color: '#92400E', backgroundColor: '#FFF9E6', fontWeight: 600 }}
                      >
                        <OctagonX className="w-3.5 h-3.5" /> 중단 요청 접수됨
                      </button>
                    ) : (
                      <button
                        onClick={() => openTerminationDialog(m)}
                        disabled={!ACTIVE_STATUSES.has(m.status)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl border text-xs disabled:opacity-50"
                        style={{ borderColor: '#E5E7EB', color: '#6B7280', fontWeight: 600 }}
                      >
                        <OctagonX className="w-3.5 h-3.5" /> 매칭 중단 요청
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!activeMatch} onOpenChange={(o) => { if (!o) closeDetail(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" style={{ color: '#FF8A3D' }} />
              {activeMatch?.elderName} 어르신 매칭 상세
            </DialogTitle>
            <DialogDescription>
              매칭 상태와 사전 인사말, 매칭 일시를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-10 text-center text-gray-500">
              <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin" style={{ color: '#FF8A3D' }} />
              <p style={{ fontSize: '0.9rem' }}>상세 정보를 불러오는 중...</p>
            </div>
          ) : detailError ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#FEE2E2' }}>
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-gray-700 font-semibold mb-1" style={{ fontSize: '0.95rem' }}>상세 정보를 불러오지 못했습니다</p>
              <p className="text-gray-500 mb-4" style={{ fontSize: '0.85rem' }}>{detailError}</p>
              <button
                onClick={retryDetail}
                className="px-5 py-2 rounded-2xl text-white inline-flex items-center gap-1.5"
                style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.88rem' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 시도
              </button>
            </div>
          ) : activeDetail ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500" style={{ fontSize: '0.85rem' }}>매칭 상태</span>
                <StatusBadge status={activeDetail.status} />
              </div>

              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#FAF8F5' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>어르신 정보</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600" style={{ fontSize: '0.83rem' }}>
                  <div>이름: <span className="text-gray-900 font-medium">{activeDetail.elder.name}</span></div>
                  <div>연령대: <span className="text-gray-900 font-medium">{activeDetail.elder.ageGroup}</span></div>
                  <div>선호 통화: <span className="text-gray-900 font-medium">{CALL_TYPE_LABEL[activeDetail.elder.preferredCallType]}</span></div>
                  <div>난이도: <span className="text-gray-900 font-medium">{DIFFICULTY_LABEL[activeDetail.elder.difficultyLevel]}</span></div>
                </div>
                {activeDetail.elder.interests && activeDetail.elder.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeDetail.elder.interests.map((it) => (
                      <span
                        key={it}
                        className="px-2.5 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D', fontWeight: 600 }}
                      >
                        #{it}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFF4E6' }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: '#FF8A3D' }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>내가 보낸 사전 인사말</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {activeDetail.icebreakingMessage}
                </p>
              </div>

              <div className="space-y-1.5 text-gray-600" style={{ fontSize: '0.85rem' }}>
                <div className="flex justify-between">
                  <span className="text-gray-500">선택 일시</span>
                  <span className="text-gray-900">{formatDateTime(activeDetail.selectedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">매칭 일시</span>
                  <span className="text-gray-900">{formatDateTime(activeDetail.matchedAt)}</span>
                </div>
                {activeDetail.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">종료 일시</span>
                    <span className="text-gray-900">{formatDateTime(activeDetail.endedAt)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={showPlaceholderToast}
                  disabled={activeDetail.status === "ENDED"}
                  className="py-2.5 rounded-2xl text-white inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.88rem' }}
                >
                  <Video className="w-4 h-4" />
                  화상 통화
                </button>
                <button
                  onClick={showPlaceholderToast}
                  disabled={activeDetail.status === "ENDED"}
                  className="py-2.5 rounded-2xl border inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ borderColor: '#E5E7EB', color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}
                >
                  <Phone className="w-4 h-4" />
                  음성 통화
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={terminationTarget !== null}
        onOpenChange={(open) => {
          if (!open && !terminationSubmitting) closeTerminationDialog();
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <OctagonX className="w-5 h-5" style={{ color: '#E6A817' }} />
              매칭 중단 요청
            </DialogTitle>
            <DialogDescription>
              관리자 검토 후 매칭이 종료됩니다. 신중하게 작성해 주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {terminationTarget && (
              <div className="rounded-2xl p-3" style={{ backgroundColor: '#FAF8F5' }}>
                <p className="text-gray-700" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {terminationTarget.elderName} 어르신
                </p>
                <p className="text-gray-400 mt-1" style={{ fontSize: '0.75rem' }}>
                  매칭번호 <span className="font-mono">{terminationTarget.matchId.slice(0, 8)}</span>
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">중단 요청 사유</p>
              <textarea
                value={terminationReason}
                onChange={(e) => {
                  setTerminationReason(e.target.value.slice(0, TERMINATION_REASON_MAX));
                  if (terminationError) setTerminationError(null);
                }}
                disabled={terminationSubmitting}
                rows={4}
                placeholder="중단을 요청하는 사유를 구체적으로 적어주세요."
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-amber-300 disabled:bg-gray-50"
              />
              <p className="text-right text-xs text-gray-400">
                {terminationReason.length} / {TERMINATION_REASON_MAX}자
              </p>
            </div>

            {terminationError && (
              <div className="rounded-2xl p-3" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{terminationError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={closeTerminationDialog}
                disabled={terminationSubmitting}
              >
                취소
              </Button>
              <Button
                className="flex-1 rounded-2xl text-white"
                style={{ backgroundColor: '#E6A817' }}
                onClick={() => void handleSubmitTermination()}
                disabled={terminationSubmitting || !terminationReason.trim()}
              >
                {terminationSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    요청 중...
                  </>
                ) : (
                  "중단 요청"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reportTarget !== null}
        onOpenChange={(open) => {
          if (!open && !reportSubmitting) closeReportDialog();
        }}
      >
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              {reportTarget?.elderName} 어르신 관련 신고
            </DialogTitle>
            <DialogDescription>
              불편했던 상황을 알려주시면 관리자가 확인합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">신고 유형</p>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPE_OPTIONS.map((opt) => {
                  const active = reportType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReportType(opt.value)}
                      disabled={reportSubmitting}
                      className="py-2 rounded-2xl text-xs border-2 transition-colors disabled:opacity-60"
                      style={{
                        borderColor: active ? '#EF4444' : '#E5E7EB',
                        backgroundColor: active ? '#FEF2F2' : 'white',
                        color: active ? '#EF4444' : '#6B7280',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">신고 내용</p>
              <textarea
                value={reportContent}
                onChange={(e) => {
                  setReportContent(e.target.value.slice(0, REPORT_CONTENT_MAX));
                  if (reportError) setReportError(null);
                }}
                disabled={reportSubmitting}
                rows={4}
                placeholder="불편했던 상황을 구체적으로 적어주세요."
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-red-300 disabled:bg-gray-50"
              />
              <p className="text-right text-xs text-gray-400">
                {reportContent.length} / {REPORT_CONTENT_MAX}자
              </p>
            </div>

            {reportError && (
              <div className="rounded-2xl p-3" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{reportError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={closeReportDialog}
                disabled={reportSubmitting}
              >
                취소
              </Button>
              <Button
                className="flex-1 rounded-2xl text-white"
                style={{ backgroundColor: '#EF4444' }}
                onClick={() => void handleSubmitReport()}
                disabled={reportSubmitting || !reportContent.trim()}
              >
                {reportSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    접수 중...
                  </>
                ) : (
                  "신고 접수"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
