import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import {
  Heart, LogOut, User, Plus, Tablet, ChevronRight,
  Clock, Flag, BookOpen, Loader2, RefreshCw,
  Calendar as CalendarIcon, MessageCircle, UserCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApiError } from "../../lib/api/client";
import { getMyElders } from "../../lib/api/elder";
import { getMatchDetail, getMyMatches } from "../../lib/api/matching";
import {
  createElderAvailableTime,
  getElderAvailableTimes,
} from "../../lib/api/availableTime";
import { getMySchedules } from "../../lib/api/schedule";
import type {
  AvailableTimeResponse,
  CallType,
  DifficultyLevel,
  ElderResponse,
  MatchDetailResponse,
  MatchStatus,
  MatchSummaryResponse,
  ScheduleResponse,
  ScheduleStatus,
} from "../../types/api";
import { ErrorCode } from "../../types/api";
import { useAuth } from "../../lib/auth/AuthContext";

const MATCH_STATUS_LABEL: Record<MatchStatus, { label: string; color: string; bg: string }> = {
  MATCHED:                { label: "매칭됨",      color: "#3DAF8A", bg: "#E8F8F5" },
  IN_PROGRESS:            { label: "진행 중",     color: "#3D7AFF", bg: "#EBF4FF" },
  TERMINATION_REQUESTED:  { label: "중단 요청됨", color: "#E6A817", bg: "#FFF9E6" },
  ENDED:                  { label: "종료됨",      color: "#9CA3AF", bg: "#F3F4F6" },
};

const CALL_TYPE_LABEL: Record<CallType, string> = {
  VIDEO: "화상 통화",
  AUDIO: "음성 통화",
};

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  LOW:    "쉬움",
  MEDIUM: "보통",
  HIGH:   "어려움",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date = "", rest = ""] = value.split("T");
  return { date, time: rest.slice(0, 5) };
}

function resolveElderListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      return err.message || "보호자 권한이 필요합니다.";
    }
    return err.message || "어르신 목록을 불러오지 못했습니다.";
  }
  return "어르신 목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveMatchListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      return err.message || "보호자 권한이 필요합니다.";
    }
    return err.message || "매칭 정보를 불러오지 못했습니다.";
  }
  return "매칭 정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

const MATCHED_AT_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatMatchedAt(value: string | null): string {
  if (!value) return "";
  const { date, time } = splitLocalDateTime(value);
  const [y, m, d] = date.split("-").map((n) => Number(n));
  const [hh, mm] = time.split(":").map((n) => Number(n));
  if (!y || !m || !d) return value;
  const dt = new Date(y, m - 1, d, hh || 0, mm || 0);
  return MATCHED_AT_FORMATTER.format(dt);
}

function resolveMatchDetailError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      return err.message || "이 매칭 정보를 볼 권한이 없습니다.";
    }
    if (err.status === 404) return "매칭 정보를 찾을 수 없습니다.";
    return err.message || "매칭 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "매칭 상세 정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveAvailLoadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) return err.message || "가능 시간을 조회할 권한이 없습니다.";
    if (err.status === 404) return "어르신 정보를 찾을 수 없습니다.";
    return err.message || "가능 시간을 불러오지 못했습니다.";
  }
  return "가능 시간을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveScheduleLoadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      return err.message || "보호자 권한이 필요합니다.";
    }
    return err.message || "일정 정보를 불러오지 못했습니다.";
  }
  return "일정 정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "대기 중", color: "#92400E", bg: "#FEF3C7" },
  CONFIRMED: { label: "확정",    color: "#6D28D9", bg: "#EDE9FE" },
  COMPLETED: { label: "완료",    color: "#3DAF8A", bg: "#E8F8F5" },
  CANCELED:  { label: "취소됨",  color: "#9CA3AF", bg: "#F3F4F6" },
};

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" });

function formatScheduleRange(startStr: string, endStr: string): string {
  const { date, time: startTime } = splitLocalDateTime(startStr);
  const { time: endTime } = splitLocalDateTime(endStr);
  const [y, m, d] = date.split("-").map((n) => Number(n));
  if (!y || !m || !d) {
    return `${date} ${startTime} ~ ${endTime}`;
  }
  const dt = new Date(y, m - 1, d);
  return `${MONTH_DAY_FORMATTER.format(dt)} ${startTime} ~ ${endTime}`;
}

function resolveAvailCreateError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.INVALID_AVAILABLE_TIME_RANGE:
        return "시작 시간은 종료 시간보다 빨라야 합니다.";
      case ErrorCode.AVAILABLE_TIME_OVERLAPPED:
        return "이미 등록된 시간과 겹칩니다.";
      case ErrorCode.AVAILABLE_TIME_ACCESS_DENIED:
        return "본인이 등록한 어르신만 가능 시간을 등록할 수 있습니다.";
      case ErrorCode.INVALID_AVAILABLE_TIME_QUERY:
        return "요청 형식이 올바르지 않습니다.";
      case "E001":
        return "어르신 정보를 찾을 수 없습니다.";
      case "E002":
        return "본인이 등록한 어르신만 가능 시간을 등록할 수 있습니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 400) return err.message || "입력값을 확인해 주세요.";
    if (err.status === 403) return err.message || "이용 권한이 없습니다.";
    if (err.status === 404) return "어르신 정보를 찾을 수 없습니다.";
    return err.message || "가능 시간 등록에 실패했습니다.";
  }
  return "가능 시간 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function GuardianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const [elders, setElders] = useState<ElderResponse[]>([]);
  const [eldersLoading, setEldersLoading] = useState(false);
  const [eldersError, setEldersError] = useState<string | null>(null);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchSummaryResponse[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const [elderAvailTimes, setElderAvailTimes] = useState<AvailableTimeResponse[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);

  const [availDate, setAvailDate] = useState<string>(todayDateString());
  const [availStart, setAvailStart] = useState<string>("");
  const [availEnd, setAvailEnd] = useState<string>("");
  const [isSubmittingAvail, setIsSubmittingAvail] = useState(false);

  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  // FE-5C 매칭 상세 Dialog
  const [activeMatchSummary, setActiveMatchSummary] = useState<MatchSummaryResponse | null>(null);
  const [matchDetail, setMatchDetail] = useState<MatchDetailResponse | null>(null);
  const [matchDetailLoading, setMatchDetailLoading] = useState(false);
  const [matchDetailError, setMatchDetailError] = useState<string | null>(null);

  // F-31 신고하기 (후속 API 미연결 — placeholder)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ElderResponse | null>(null);
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

  const openReport = (elder: ElderResponse) => {
    setReportTarget(elder);
    setReportType("부적절한 언행");
    setReportContent("");
    setReportOpen(true);
  };
  const handleSubmitReport = () => {
    if (!reportContent.trim()) { toast.error("신고 내용을 입력해주세요."); return; }
    toast.message("신고 접수는 다음 단계에서 연결 예정입니다.");
    setReportOpen(false);
  };

  const loadElders = useCallback(async () => {
    if (!user) {
      setElders([]);
      setEldersError(null);
      setEldersLoading(false);
      return;
    }
    setEldersLoading(true);
    setEldersError(null);
    try {
      const list = await getMyElders();
      setElders(list ?? []);
      setSelectedElderId((prev) => {
        if (prev && list?.some((e) => e.elderId === prev)) return prev;
        return list && list.length > 0 ? list[0].elderId : null;
      });
    } catch (err) {
      setElders([]);
      setSelectedElderId(null);
      setEldersError(resolveElderListError(err));
    } finally {
      setEldersLoading(false);
    }
  }, [user]);

  const loadMatches = useCallback(async () => {
    if (!user) {
      setMatches([]);
      setMatchesError(null);
      setMatchesLoading(false);
      return;
    }
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const list = await getMyMatches();
      setMatches(list ?? []);
    } catch (err) {
      setMatches([]);
      setMatchesError(resolveMatchListError(err));
    } finally {
      setMatchesLoading(false);
    }
  }, [user]);

  const loadElderAvailTimes = useCallback(
    async (elderId: string | null) => {
      if (!elderId) {
        setElderAvailTimes([]);
        setAvailError(null);
        setAvailLoading(false);
        return;
      }
      setAvailLoading(true);
      setAvailError(null);
      try {
        const list = await getElderAvailableTimes(elderId);
        const sorted = (list ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
        setElderAvailTimes(sorted);
      } catch (err) {
        setElderAvailTimes([]);
        setAvailError(resolveAvailLoadError(err));
      } finally {
        setAvailLoading(false);
      }
    },
    [],
  );

  const loadSchedules = useCallback(async () => {
    if (!user) {
      setSchedules([]);
      setSchedulesError(null);
      setSchedulesLoading(false);
      return;
    }
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      const list = await getMySchedules();
      setSchedules(list ?? []);
    } catch (err) {
      setSchedules([]);
      setSchedulesError(resolveScheduleLoadError(err));
    } finally {
      setSchedulesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadElders();
  }, [loadElders]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    void loadElderAvailTimes(selectedElderId);
  }, [selectedElderId, loadElderAvailTimes]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const matchesByElder = useMemo(() => {
    const map = new Map<string, MatchSummaryResponse[]>();
    for (const m of matches) {
      const arr = map.get(m.elderId);
      if (arr) arr.push(m);
      else map.set(m.elderId, [m]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const at = a.matchedAt ?? a.selectedAt;
        const bt = b.matchedAt ?? b.selectedAt;
        return bt.localeCompare(at);
      });
    }
    return map;
  }, [matches]);

  const sortedSchedules = useMemo(() => {
    const active: ScheduleResponse[] = [];
    const canceled: ScheduleResponse[] = [];
    for (const s of schedules) {
      if (s.status === "CANCELED") canceled.push(s);
      else active.push(s);
    }
    active.sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt));
    canceled.sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt));
    return [...active, ...canceled];
  }, [schedules]);

  const fetchMatchDetail = useCallback(async (matchId: string) => {
    setMatchDetailLoading(true);
    setMatchDetailError(null);
    try {
      const detail = await getMatchDetail(matchId);
      setMatchDetail(detail);
    } catch (err) {
      setMatchDetail(null);
      setMatchDetailError(resolveMatchDetailError(err));
    } finally {
      setMatchDetailLoading(false);
    }
  }, []);

  const openMatchDetail = useCallback(
    (match: MatchSummaryResponse) => {
      setActiveMatchSummary(match);
      setMatchDetail(null);
      setMatchDetailError(null);
      void fetchMatchDetail(match.matchId);
    },
    [fetchMatchDetail],
  );

  const closeMatchDetail = useCallback(() => {
    setActiveMatchSummary(null);
    setMatchDetail(null);
    setMatchDetailError(null);
    setMatchDetailLoading(false);
  }, []);

  const retryMatchDetail = useCallback(() => {
    if (activeMatchSummary) void fetchMatchDetail(activeMatchSummary.matchId);
  }, [activeMatchSummary, fetchMatchDetail]);

  const handleSubmitAvail = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!selectedElderId) {
      toast.error("어르신을 먼저 선택해 주세요.");
      return;
    }
    if (!availDate || !availStart || !availEnd) {
      toast.error("날짜와 시작/종료 시간을 모두 입력해 주세요.");
      return;
    }
    if (availEnd <= availStart) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setIsSubmittingAvail(true);
    try {
      await createElderAvailableTime(selectedElderId, {
        startTime: `${availDate}T${availStart}:00`,
        endTime: `${availDate}T${availEnd}:00`,
      });
      toast.success("가능 시간이 등록되었습니다.");
      setAvailStart("");
      setAvailEnd("");
      await loadElderAvailTimes(selectedElderId);
    } catch (err) {
      toast.error(resolveAvailCreateError(err));
    } finally {
      setIsSubmittingAvail(false);
    }
  };

  const selectedElder = elders.find((e) => e.elderId === selectedElderId) ?? null;

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

        {/* 등록된 어르신 목록 (FE-5B: 보호자 매칭 현황 연동) */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-700" style={{ fontSize: '1rem', fontWeight: 600 }}>등록된 어르신</h2>
          <button
            onClick={() => { void loadElders(); void loadMatches(); }}
            disabled={eldersLoading || matchesLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-emerald-50"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
            aria-label="어르신/매칭 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(eldersLoading || matchesLoading) ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {eldersLoading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span style={{ fontSize: '0.9rem' }}>어르신 정보를 불러오는 중...</span>
          </div>
        ) : eldersError ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
              <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{eldersError}</p>
              <button
                onClick={() => void loadElders()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 시도
              </button>
            </div>
          </div>
        ) : elders.length === 0 ? (
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
            {matchesError && (
              <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-xs" style={{ color: '#B91C1C', fontWeight: 600 }}>{matchesError}</p>
                <button
                  onClick={() => void loadMatches()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl"
                  style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <RefreshCw className="w-3 h-3" />
                  매칭 정보 다시 시도
                </button>
              </div>
            )}
            {elders.map((elder) => {
              const elderMatches = matchesByElder.get(elder.elderId) ?? [];
              const activeMatches = elderMatches.filter((m) => m.status !== "ENDED");
              const visibleMatches = activeMatches.length > 0 ? activeMatches : elderMatches.slice(0, 1);

              return (
                <div key={elder.elderId} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {/* 어르신 정보 헤더 */}
                  <div className="p-5 border-b border-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                          style={{ backgroundColor: '#E5E7EB' }}
                        >
                          {elder.profileImageUrl ? (
                            <img src={elder.profileImageUrl} alt={`${elder.name} 어르신`} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{elder.name} 어르신</p>
                          <p className="text-gray-500" style={{ fontSize: '0.82rem' }}>
                            {elder.ageGroup} · {CALL_TYPE_LABEL[elder.preferredCallType]} · 난이도 {DIFFICULTY_LABEL[elder.difficultyLevel]}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-3 py-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}
                      >
                        <Tablet className="w-3 h-3 inline mr-1" />
                        전용 기기
                      </span>
                    </div>

                    {elder.interests && elder.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {elder.interests.slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: '#FFF1E5', color: '#C2410C', fontWeight: 600 }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 매칭 현황 */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-gray-700" style={{ fontSize: '0.88rem' }}>
                          매칭된 청년
                          {elderMatches.length > 0 && (
                            <span className="text-gray-400 font-normal"> ({elderMatches.length}건)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {matchesLoading && elderMatches.length === 0 ? (
                      <div className="flex items-center gap-2 py-2 text-gray-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span style={{ fontSize: '0.82rem' }}>매칭 정보를 불러오는 중...</span>
                      </div>
                    ) : visibleMatches.length === 0 ? (
                      <div className="rounded-2xl px-4 py-3 text-center text-gray-400" style={{ backgroundColor: '#FAF8F5', border: '1.5px dashed #E5E7EB' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>아직 매칭된 청년이 없습니다</p>
                        <p style={{ fontSize: '0.75rem' }} className="mt-0.5">
                          청년이 어르신을 선택하면 여기에 표시됩니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleMatches.map((m) => {
                          const status = MATCH_STATUS_LABEL[m.status];
                          const matchedAtText = formatMatchedAt(m.matchedAt ?? m.selectedAt);
                          return (
                            <div
                              key={m.matchId}
                              className="rounded-2xl p-3"
                              style={{ backgroundColor: '#FAF8F5', border: '1.5px solid #F3F4F6' }}
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: '#FFE8D6' }}>🧑</div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate" style={{ fontSize: '0.88rem' }}>
                                      {m.youthName} 청년
                                    </p>
                                    {matchedAtText && (
                                      <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>
                                        {m.matchedAt ? '매칭 일시' : '선택 일시'} · {matchedAtText}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className="text-xs px-2.5 py-0.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: status.bg, color: status.color, fontWeight: 600 }}
                                >
                                  {status.label}
                                </span>
                              </div>

                              {m.icebreakingMessage && (
                                <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-xl bg-white" style={{ border: '1px solid #F3F4F6' }}>
                                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#3DAF8A' }} />
                                  <p className="text-gray-600 line-clamp-2" style={{ fontSize: '0.78rem' }}>
                                    {m.icebreakingMessage}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 후속 기능 버튼 — 신고/활동 기록은 다음 단계 */}
                  <div className="px-5 pb-4 pt-0 flex flex-wrap gap-2">
                    {(() => {
                      const detailTarget =
                        visibleMatches.find((m) => m.status !== "ENDED") ?? visibleMatches[0] ?? null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (detailTarget) openMatchDetail(detailTarget);
                          }}
                          disabled={!detailTarget}
                          className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-2xl border text-gray-500 disabled:opacity-50"
                          style={{ borderColor: '#E5E7EB', fontWeight: 600 }}
                        >
                          <ChevronRight className="w-3.5 h-3.5" /> 매칭 정보 보기
                        </button>
                      );
                    })()}
                    {visibleMatches.length > 0 && visibleMatches.some((m) => m.status !== "ENDED") && (
                      <button
                        type="button"
                        onClick={() => toast.message("매칭 중단 요청은 다음 단계에서 연결 예정입니다.")}
                        className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-2xl border text-gray-500"
                        style={{ borderColor: '#E5E7EB', fontWeight: 600 }}
                      >
                        매칭 중단 요청
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openReport(elder)}
                      className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-2xl border ml-auto"
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

        {/* 다가오는 일정 (FE-5A 보호자 일정 조회) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-700" style={{ fontSize: '1rem', fontWeight: 600 }}>
              다가오는 일정
            </h2>
            <button
              onClick={() => void loadSchedules()}
              disabled={schedulesLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-emerald-50"
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
              aria-label="일정 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${schedulesLoading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-5">
            {schedulesLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ fontSize: '0.88rem' }}>일정을 불러오는 중...</span>
              </div>
            ) : schedulesError ? (
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{schedulesError}</p>
                <button
                  onClick={() => void loadSchedules()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 시도
                </button>
              </div>
            ) : sortedSchedules.length === 0 ? (
              <div className="rounded-2xl p-6 text-center text-gray-400" style={{ backgroundColor: '#FAF8F5', border: '1.5px dashed #E5E7EB' }}>
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>예정된 일정이 없습니다</p>
                <p style={{ fontSize: '0.78rem' }} className="mt-1">
                  청년이 어르신과 대화 일정을 만들면 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedSchedules.map((s) => {
                  const status = SCHEDULE_STATUS_LABEL[s.status];
                  const isCanceled = s.status === "CANCELED";
                  return (
                    <div
                      key={s.scheduleId}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        border: `1.5px solid ${isCanceled ? '#E5E7EB' : '#C7EBDB'}`,
                        opacity: isCanceled ? 0.7 : 1,
                      }}
                    >
                      <div
                        className="px-4 py-2 flex items-center justify-between"
                        style={{ backgroundColor: isCanceled ? '#F9FAFB' : '#F0FAF6' }}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5" style={{ color: isCanceled ? '#9CA3AF' : '#3DAF8A' }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isCanceled ? '#9CA3AF' : '#3DAF8A' }}>
                            대화 일정
                          </span>
                        </div>
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: status.bg, color: status.color, fontWeight: 600 }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl leading-none">👵</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-gray-900 truncate"
                              style={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                textDecoration: isCanceled ? 'line-through' : 'none',
                              }}
                            >
                              {s.elderName} 어르신
                            </p>
                            <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.82rem' }}>
                              청년 {s.youthName}
                            </p>
                          </div>
                        </div>

                        <div
                          className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl"
                          style={{ backgroundColor: '#FAF8F5', color: '#6B7280' }}
                        >
                          <Clock className="w-3.5 h-3.5" style={{ color: '#3DAF8A' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {formatScheduleRange(s.scheduledStartAt, s.scheduledEndAt)}
                          </span>
                        </div>

                        {isCanceled && s.cancelReason && (
                          <p className="text-xs text-gray-400 mt-2">
                            취소 사유: {s.cancelReason}
                          </p>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => toast.message("일정 상세 보기는 다음 단계에서 연결 예정입니다.")}
                            className="flex-1 py-2 rounded-xl border text-gray-500"
                            style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            일정 상세
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.message("통화 보기는 다음 단계에서 연결 예정입니다.")}
                            className="flex-1 py-2 rounded-xl border text-gray-500"
                            style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.82rem' }}
                          >
                            통화 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 어르신 가능 시간 관리 (FE-4B 백엔드 연동) */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-700" style={{ fontSize: '1rem', fontWeight: 600 }}>
              어르신 가능 시간 관리
            </h2>
            <button
              onClick={() => {
                void loadElders();
                if (selectedElderId) void loadElderAvailTimes(selectedElderId);
              }}
              disabled={eldersLoading || availLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-emerald-50"
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
              aria-label="가능 시간 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(eldersLoading || availLoading) ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-5">
            {eldersLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ fontSize: '0.88rem' }}>어르신 목록을 불러오는 중...</span>
              </div>
            ) : eldersError ? (
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{eldersError}</p>
                <button
                  onClick={() => void loadElders()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 시도
                </button>
              </div>
            ) : elders.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-500" style={{ fontSize: '0.9rem', fontWeight: 600 }}>등록된 어르신이 없어요</p>
                <p className="text-gray-400 mt-1" style={{ fontSize: '0.8rem' }}>
                  먼저 어르신을 등록해 주세요. 등록 후 가능 시간을 관리할 수 있어요.
                </p>
                <Link to="/guardian/senior-profile">
                  <button className="mt-3 px-4 py-2 rounded-2xl text-white" style={{ backgroundColor: '#3DAF8A', fontWeight: 600, fontSize: '0.85rem' }}>
                    어르신 등록하러 가기
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 어르신 선택 */}
                <div>
                  <p className="text-gray-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600 }}>어르신 선택</p>
                  <div className="flex gap-2 flex-wrap">
                    {elders.map((e) => {
                      const active = e.elderId === selectedElderId;
                      return (
                        <button
                          key={e.elderId}
                          type="button"
                          onClick={() => setSelectedElderId(e.elderId)}
                          className="px-4 py-2 rounded-2xl border-2 transition-colors"
                          style={{
                            borderColor: active ? '#3DAF8A' : '#E5E7EB',
                            backgroundColor: active ? '#E8F8F5' : 'white',
                            color: active ? '#3DAF8A' : '#6B7280',
                            fontSize: '0.85rem',
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {e.name} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>· {e.ageGroup}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedElder && (
                  <>
                    {/* 가능 시간 목록 */}
                    <div>
                      <p className="text-gray-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {selectedElder.name} 어르신 가능 시간
                      </p>

                      {availLoading ? (
                        <div className="py-5 flex items-center justify-center gap-2 text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span style={{ fontSize: '0.85rem' }}>가능 시간을 불러오는 중...</span>
                        </div>
                      ) : availError ? (
                        <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                          <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{availError}</p>
                          <button
                            onClick={() => void loadElderAvailTimes(selectedElderId)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            다시 시도
                          </button>
                        </div>
                      ) : elderAvailTimes.length === 0 ? (
                        <div className="rounded-2xl p-4 text-center text-gray-400" style={{ backgroundColor: '#FAF8F5', border: '1.5px dashed #E5E7EB' }}>
                          <Clock className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          <p style={{ fontSize: '0.85rem' }}>등록된 가능 시간이 없습니다</p>
                          <p style={{ fontSize: '0.75rem' }}>아래에서 가능 시간을 추가해 주세요.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {elderAvailTimes.map((at) => {
                            const { date, time: start } = splitLocalDateTime(at.startTime);
                            const { time: end } = splitLocalDateTime(at.endTime);
                            return (
                              <div
                                key={at.availableTimeId}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                                style={{ backgroundColor: '#F0FAF6', border: '1.5px solid #C7EBDB' }}
                              >
                                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#3DAF8A' }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-800" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                                    {date} · {start} ~ {end}
                                  </p>
                                  <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                                    {at.isBooked ? '청년과 일정이 잡힌 시간입니다' : '대화 가능 시간'}
                                  </p>
                                </div>
                                {at.isBooked && (
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', fontWeight: 600 }}
                                  >
                                    예약됨
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 가능 시간 등록 폼 */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#FAF8F5', border: '1.5px solid #F3F4F6' }}>
                      <p className="text-gray-700 mb-3" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        가능 시간 추가
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="text-gray-500 mb-1 block" style={{ fontSize: '0.72rem' }}>날짜</label>
                          <input
                            type="date"
                            value={availDate}
                            min={todayDateString()}
                            onChange={(e) => setAvailDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 mb-1 block" style={{ fontSize: '0.72rem' }}>시작 시간</label>
                          <input
                            type="time"
                            step={60}
                            value={availStart}
                            onChange={(e) => setAvailStart(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-500 mb-1 block" style={{ fontSize: '0.72rem' }}>종료 시간</label>
                          <input
                            type="time"
                            step={60}
                            value={availEnd}
                            onChange={(e) => setAvailEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-300 bg-white"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSubmitAvail()}
                        disabled={isSubmittingAvail}
                        className="w-full py-2.5 rounded-2xl text-white flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ backgroundColor: '#3DAF8A', fontWeight: 700, fontSize: '0.9rem' }}
                      >
                        {isSubmittingAvail && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSubmittingAvail ? '등록 중...' : '가능 시간 등록'}
                      </button>
                      <p className="text-gray-400 mt-2" style={{ fontSize: '0.72rem' }}>
                        등록된 가능 시간 안에서만 청년과 일정이 잡힐 수 있어요.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* F-31 신고하기 다이얼로그 (placeholder — 신고 API 미연결) */}
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

      {/* FE-5C 매칭 상세 Dialog */}
      <Dialog
        open={activeMatchSummary !== null}
        onOpenChange={(open) => {
          if (!open) closeMatchDetail();
        }}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" style={{ color: '#3DAF8A' }} />
              {activeMatchSummary?.elderName} 어르신 매칭 상세
            </DialogTitle>
            <DialogDescription>
              매칭 상태와 청년 정보, 사전 인사말을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {matchDetailLoading ? (
            <div className="py-10 text-center text-gray-500">
              <Loader2 className="w-7 h-7 mx-auto mb-2 animate-spin" style={{ color: '#3DAF8A' }} />
              <p style={{ fontSize: '0.9rem' }}>매칭 상세 정보를 불러오는 중...</p>
            </div>
          ) : matchDetailError ? (
            <div className="py-6 text-center">
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{matchDetailError}</p>
                <button
                  type="button"
                  onClick={retryMatchDetail}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: '#3DAF8A', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 시도
                </button>
              </div>
            </div>
          ) : matchDetail ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500" style={{ fontSize: '0.85rem' }}>매칭 상태</span>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: MATCH_STATUS_LABEL[matchDetail.status].bg,
                    color: MATCH_STATUS_LABEL[matchDetail.status].color,
                    fontWeight: 600,
                  }}
                >
                  {MATCH_STATUS_LABEL[matchDetail.status].label}
                </span>
              </div>

              <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: '#FAF8F5' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>어르신 정보</p>
                <div className="grid grid-cols-2 gap-2 text-gray-600" style={{ fontSize: '0.83rem' }}>
                  <div>이름: <span className="text-gray-900 font-medium">{matchDetail.elder.name}</span></div>
                  <div>연령대: <span className="text-gray-900 font-medium">{matchDetail.elder.ageGroup}</span></div>
                  <div>선호 통화: <span className="text-gray-900 font-medium">{CALL_TYPE_LABEL[matchDetail.elder.preferredCallType]}</span></div>
                  <div>난이도: <span className="text-gray-900 font-medium">{DIFFICULTY_LABEL[matchDetail.elder.difficultyLevel]}</span></div>
                </div>
                {matchDetail.elder.interests && matchDetail.elder.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchDetail.elder.interests.map((it) => (
                      <span
                        key={it}
                        className="px-2.5 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: '#FFF1E5', color: '#C2410C', fontWeight: 600 }}
                      >
                        #{it}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: '#E8F8F5' }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }} className="mb-1.5">
                  매칭된 청년
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ backgroundColor: '#FFE8D6' }}>🧑</div>
                  <p className="text-gray-900" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {matchDetail.youth.name} 청년
                  </p>
                </div>
              </div>

              <div className="rounded-2xl p-4" style={{ backgroundColor: '#FAF8F5' }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: '#3DAF8A' }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>청년이 보낸 사전 인사말</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {matchDetail.icebreakingMessage}
                </p>
              </div>

              <div className="space-y-1.5 text-gray-600" style={{ fontSize: '0.85rem' }}>
                <div className="flex justify-between">
                  <span className="text-gray-500">선택 일시</span>
                  <span className="text-gray-900">{formatMatchedAt(matchDetail.selectedAt) || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">매칭 일시</span>
                  <span className="text-gray-900">{formatMatchedAt(matchDetail.matchedAt) || '-'}</span>
                </div>
                {matchDetail.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">종료 일시</span>
                    <span className="text-gray-900">{formatMatchedAt(matchDetail.endedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => toast.message("활동 기록 보기는 다음 단계에서 연결 예정입니다.")}
                  className="flex-1 py-2.5 rounded-2xl border text-gray-500 inline-flex items-center justify-center gap-1.5"
                  style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <BookOpen className="w-3.5 h-3.5" /> 활동 기록 보기
                </button>
                {matchDetail.status !== "ENDED" && (
                  <button
                    type="button"
                    onClick={() => toast.message("매칭 중단 요청은 다음 단계에서 연결 예정입니다.")}
                    className="flex-1 py-2.5 rounded-2xl border text-gray-500 inline-flex items-center justify-center gap-1.5"
                    style={{ borderColor: '#E5E7EB', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    매칭 중단 요청
                  </button>
                )}
              </div>
            </div>
          ) : null}
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
