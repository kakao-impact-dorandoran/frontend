import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Heart,
  ArrowLeft,
  Clock,
  Video,
  Phone,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApiError } from "../../lib/api/client";
import {
  createYouthAvailableTime,
  getMyYouthAvailableTimes,
} from "../../lib/api/availableTime";
import { getMyMatches } from "../../lib/api/matching";
import {
  cancelSchedule,
  createSchedule,
  getMySchedules,
} from "../../lib/api/schedule";
import type {
  AvailableTimeResponse,
  MatchSummaryResponse,
  ScheduleResponse,
} from "../../types/api";
import { ErrorCode } from "../../types/api";
import { useAuth } from "../../lib/auth/AuthContext";

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "19:00",
  "20:00",
];

const SCHEDULE_COLOR = { bg: "#EDE9FE", text: "#6D28D9" };

const shortName = (full: string) => full.replace(" 어르신", "");

// 백엔드 LocalDateTime("YYYY-MM-DDTHH:mm:ss") 문자열을 date/time 으로 분리한다.
// 타임존 변환을 하지 않는다 (백엔드/프론트 모두 Asia/Seoul wall clock 사용).
function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date = "", rest = ""] = value.split("T");
  const time = rest.slice(0, 5);
  return { date, time };
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function resolveLoadError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "가입 신청이 반려되어 이용할 수 없습니다.";
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      return err.message || fallback;
    }
    return err.message || fallback;
  }
  return `${fallback} 네트워크 상태를 확인해주세요.`;
}

function resolveAvailableTimeCreateError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.INVALID_AVAILABLE_TIME_RANGE:
        return "시작 시간은 종료 시간보다 빨라야 합니다.";
      case ErrorCode.AVAILABLE_TIME_OVERLAPPED:
        return "이미 등록된 시간과 겹칩니다.";
      case ErrorCode.AVAILABLE_TIME_ACCESS_DENIED:
        return "가능 시간 등록 권한이 없습니다.";
      case ErrorCode.INVALID_AVAILABLE_TIME_QUERY:
        return "요청 형식이 올바르지 않습니다.";
      case ErrorCode.YOUTH_PENDING:
        return "관리자 승인 완료 후 이용할 수 있습니다.";
      case ErrorCode.YOUTH_REJECTED:
        return "가입 신청이 반려되어 이용할 수 없습니다.";
      case ErrorCode.ACCOUNT_SUSPENDED:
        return "이용이 제한된 계정입니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    if (err.status === 400) return err.message || "입력값을 확인해 주세요.";
    if (err.status === 403) return err.message || "이용 권한이 없습니다.";
    return err.message || "가능 시간 등록에 실패했습니다.";
  }
  return "가능 시간 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveScheduleCreateError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.SCHEDULE_CONFLICT:
        return "이미 겹치는 일정이 있습니다.";
      case ErrorCode.SCHEDULE_OUT_OF_AVAILABLE_TIME:
        return "청년과 어르신의 가능 시간이 겹치는 시간에만 일정을 만들 수 있습니다.";
      case ErrorCode.MATCH_NOT_SCHEDULABLE:
        return "매칭된 어르신과만 일정을 만들 수 있습니다.";
      case ErrorCode.INVALID_SCHEDULE_TIME_RANGE:
        return "시작 시간은 종료 시간보다 빨라야 합니다.";
      case ErrorCode.MATCH_NOT_FOUND:
        return "매칭 정보를 찾을 수 없습니다.";
      case ErrorCode.MATCH_ACCESS_DENIED:
      case ErrorCode.ACCESS_DENIED:
        return "이 매칭에 대한 일정 권한이 없습니다.";
      case ErrorCode.YOUTH_PENDING:
        return "관리자 승인 완료 후 이용할 수 있습니다.";
      case ErrorCode.YOUTH_REJECTED:
        return "가입 신청이 반려되어 이용할 수 없습니다.";
      case ErrorCode.ACCOUNT_SUSPENDED:
        return "이용이 제한된 계정입니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    if (err.status === 400) return err.message || "입력값을 확인해 주세요.";
    if (err.status === 403) return err.message || "일정 생성 권한이 없습니다.";
    return err.message || "일정 생성에 실패했습니다.";
  }
  return "일정 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveScheduleCancelError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.SCHEDULE_ALREADY_CANCELED:
        return "이미 취소된 일정입니다.";
      case ErrorCode.SCHEDULE_ALREADY_COMPLETED:
        return "이미 완료된 일정은 취소할 수 없습니다.";
      case ErrorCode.SCHEDULE_NOT_FOUND:
        return "일정을 찾을 수 없습니다.";
      case ErrorCode.SCHEDULE_ACCESS_DENIED:
      case ErrorCode.ACCESS_DENIED:
        return "이 일정을 취소할 권한이 없습니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    return err.message || "일정 취소에 실패했습니다.";
  }
  return "일정 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

type ScheduleCancelTarget = {
  scheduleId: string;
  label: string;
};

export default function YouthSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const youthId = user?.id;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 가능 시간 등록 다이얼로그 상태
  const [availDialogOpen, setAvailDialogOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [selectedType, setSelectedType] = useState<"video" | "voice">("video");
  const [scheduleNote, setScheduleNote] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatCount, setRepeatCount] = useState(4);
  const [isSubmittingAvail, setIsSubmittingAvail] = useState(false);

  // 일정 생성 다이얼로그 상태
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleMatchId, setScheduleMatchId] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // 데이터
  const [myAvailableTimes, setMyAvailableTimes] = useState<AvailableTimeResponse[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);

  const [mySchedules, setMySchedules] = useState<ScheduleResponse[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [myMatches, setMyMatches] = useState<MatchSummaryResponse[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // 취소/삭제 확인
  const [cancelTarget, setCancelTarget] = useState<ScheduleCancelTarget | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [deleteAvailConfirm, setDeleteAvailConfirm] = useState<{ availableTimeId: string; label: string } | null>(null);

  const loadAvailableTimes = useCallback(async () => {
    if (!youthId) {
      setMyAvailableTimes([]);
      setAvailLoading(false);
      setAvailError(null);
      return;
    }
    setAvailLoading(true);
    setAvailError(null);
    try {
      const list = await getMyYouthAvailableTimes(youthId);
      setMyAvailableTimes(list ?? []);
    } catch (err) {
      setMyAvailableTimes([]);
      setAvailError(resolveLoadError(err, "가능 시간을 불러오지 못했습니다."));
    } finally {
      setAvailLoading(false);
    }
  }, [youthId]);

  const loadSchedules = useCallback(async () => {
    if (!youthId) {
      setMySchedules([]);
      setScheduleLoading(false);
      setScheduleError(null);
      return;
    }
    setScheduleLoading(true);
    setScheduleError(null);
    try {
      const list = await getMySchedules();
      setMySchedules(list ?? []);
    } catch (err) {
      setMySchedules([]);
      setScheduleError(resolveLoadError(err, "일정을 불러오지 못했습니다."));
    } finally {
      setScheduleLoading(false);
    }
  }, [youthId]);

  const loadMyMatches = useCallback(async () => {
    if (!youthId) {
      setMyMatches([]);
      setMatchesLoading(false);
      setMatchesError(null);
      return;
    }
    setMatchesLoading(true);
    setMatchesError(null);
    try {
      const list = await getMyMatches();
      setMyMatches(list ?? []);
    } catch (err) {
      setMyMatches([]);
      setMatchesError(resolveLoadError(err, "매칭 목록을 불러오지 못했습니다."));
    } finally {
      setMatchesLoading(false);
    }
  }, [youthId]);

  useEffect(() => {
    void loadAvailableTimes();
    void loadSchedules();
    void loadMyMatches();
  }, [loadAvailableTimes, loadSchedules, loadMyMatches]);

  const availabilityByDate = useMemo<Record<string, AvailableTimeResponse[]>>(() => {
    const map: Record<string, AvailableTimeResponse[]> = {};
    for (const at of myAvailableTimes) {
      const { date } = splitLocalDateTime(at.startTime);
      if (!date) continue;
      if (!map[date]) map[date] = [];
      map[date].push(at);
    }
    for (const date of Object.keys(map)) {
      map[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [myAvailableTimes]);

  const availableDates = useMemo(
    () => Object.keys(availabilityByDate).map((k) => new Date(k)),
    [availabilityByDate],
  );

  const scheduleByDate = useMemo<Record<string, ScheduleResponse[]>>(() => {
    const map: Record<string, ScheduleResponse[]> = {};
    for (const s of mySchedules) {
      const { date } = splitLocalDateTime(s.scheduledStartAt);
      if (!date) continue;
      if (!map[date]) map[date] = [];
      map[date].push(s);
    }
    for (const date of Object.keys(map)) {
      map[date].sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt));
    }
    return map;
  }, [mySchedules]);

  // 매칭 중 일정 생성 가능한 매칭만 (MATCHED / IN_PROGRESS)
  const schedulableMatches = useMemo(
    () => myMatches.filter((m) => m.status === "MATCHED" || m.status === "IN_PROGRESS"),
    [myMatches],
  );

  const handleSubmitAvailability = async () => {
    if (!youthId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!selectedDate || !selectedTime || !selectedEndTime) {
      toast.error("날짜와 시작/종료 시간을 모두 선택해주세요.");
      return;
    }
    if (selectedEndTime <= selectedTime) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    const count = repeatWeekly ? Math.max(1, Math.min(12, repeatCount)) : 1;
    const targets: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i * 7);
      targets.push(dateKey(d));
    }

    setIsSubmittingAvail(true);
    let successCount = 0;
    let lastError: unknown = null;
    for (const dk of targets) {
      try {
        await createYouthAvailableTime({
          startTime: `${dk}T${selectedTime}:00`,
          endTime: `${dk}T${selectedEndTime}:00`,
        });
        successCount += 1;
      } catch (err) {
        lastError = err;
        break;
      }
    }
    setIsSubmittingAvail(false);

    if (lastError) {
      toast.error(resolveAvailableTimeCreateError(lastError));
      if (successCount > 0) {
        toast.success(`${successCount}건 등록됨 — 나머지는 다시 시도해 주세요.`);
      }
    } else {
      toast.success(
        repeatWeekly && count > 1
          ? `${count}주 가능 시간이 등록되었습니다.`
          : "가능 시간이 등록되었습니다.",
      );
      setAvailDialogOpen(false);
      setSelectedTime("");
      setSelectedEndTime("");
      setSelectedType("video");
      setScheduleNote("");
      setRepeatWeekly(false);
      setRepeatCount(4);
    }

    await loadAvailableTimes();
  };

  const openScheduleDialog = () => {
    if (!youthId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setScheduleMatchId(schedulableMatches[0]?.matchId ?? "");
    setScheduleStart("");
    setScheduleEnd("");
    setScheduleDialogOpen(true);
  };

  const handleSubmitSchedule = async () => {
    if (!youthId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (!selectedDate) {
      toast.error("일정 날짜를 선택해주세요.");
      return;
    }
    if (!scheduleMatchId) {
      toast.error("매칭된 어르신을 선택해주세요.");
      return;
    }
    if (!scheduleStart || !scheduleEnd) {
      toast.error("시작/종료 시간을 모두 선택해주세요.");
      return;
    }
    if (scheduleEnd <= scheduleStart) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    const dk = dateKey(selectedDate);
    setIsSubmittingSchedule(true);
    try {
      await createSchedule({
        matchId: scheduleMatchId,
        scheduledStartAt: `${dk}T${scheduleStart}:00`,
        scheduledEndAt: `${dk}T${scheduleEnd}:00`,
      });
      toast.success("일정이 생성되었습니다.");
      setScheduleDialogOpen(false);
      setScheduleStart("");
      setScheduleEnd("");
      await loadSchedules();
    } catch (err) {
      toast.error(resolveScheduleCreateError(err));
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCanceling(true);
    try {
      await cancelSchedule(cancelTarget.scheduleId);
      toast.success("일정이 취소되었습니다.");
      setCancelTarget(null);
      await loadSchedules();
    } catch (err) {
      toast.error(resolveScheduleCancelError(err));
    } finally {
      setIsCanceling(false);
    }
  };

  const handleRemoveAvailPlaceholder = () => {
    toast.message("가능 시간 삭제 기능은 다음 단계에서 연결 예정입니다.");
    setDeleteAvailConfirm(null);
  };

  const selectedDateKey = selectedDate ? dateKey(selectedDate) : "";
  const selectedDateTimes = availabilityByDate[selectedDateKey] ?? [];
  const selectedDateSchedules = scheduleByDate[selectedDateKey] ?? [];

  // ── 캘린더 셀 커스텀 ──────────────────────────────────────
  const CustomDayContent = ({ date }: { date: Date }) => {
    const key = dateKey(date);
    const dayScheds = scheduleByDate[key] ?? [];
    const availCount = availabilityByDate[key]?.length ?? 0;

    return (
      <div
        className="flex flex-col items-start w-full px-1 pt-1 pb-1 gap-0.5"
        style={{ minHeight: "3.8rem" }}
      >
        <span className="w-full text-center leading-none mb-0.5" style={{ fontSize: "0.82rem" }}>
          {date.getDate()}
        </span>

        {dayScheds.map((s) => {
          const isCanceled = s.status === "CANCELED";
          return (
            <div
              key={s.scheduleId}
              className="w-full rounded-md truncate"
              style={{
                backgroundColor: isCanceled ? "#F3F4F6" : SCHEDULE_COLOR.bg,
                color: isCanceled ? "#9CA3AF" : SCHEDULE_COLOR.text,
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "1px 4px",
                lineHeight: "1.4",
                textDecoration: isCanceled ? "line-through" : "none",
              }}
            >
              {shortName(s.elderName)}
            </div>
          );
        })}

        {availCount > 0 && (
          <div
            className="w-full rounded-md truncate"
            style={{
              backgroundColor: "#FFF4E6",
              color: "#FF8A3D",
              fontSize: "0.6rem",
              fontWeight: 700,
              padding: "1px 4px",
              lineHeight: "1.4",
            }}
          >
            가능 {availCount}건
          </div>
        )}
      </div>
    );
  };

  // 다가오는 전체 일정 (실제 일정 + 실제 가능 시간, 오늘 이후, 취소되지 않은 것)
  const todayKey = dateKey(new Date());
  const upcomingSchedules = useMemo(() => {
    const fromSchedules = mySchedules
      .filter((s) => s.status !== "CANCELED")
      .map((s) => {
        const { date, time } = splitLocalDateTime(s.scheduledStartAt);
        return {
          key: `sched-${s.scheduleId}`,
          title: s.elderName,
          avatar: "👵",
          date,
          time,
          kind: "schedule" as const,
        };
      });
    const fromAvail = myAvailableTimes.map((at) => {
      const { date, time } = splitLocalDateTime(at.startTime);
      const { time: endTime } = splitLocalDateTime(at.endTime);
      return {
        key: `avail-${at.availableTimeId}`,
        title: `가능 시간 ${time}~${endTime}`,
        avatar: "🕐",
        date,
        time,
        kind: "available" as const,
      };
    });
    return [...fromSchedules, ...fromAvail]
      .filter((s) => s.date >= todayKey)
      .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1))
      .slice(0, 8);
  }, [mySchedules, myAvailableTimes, todayKey]);

  return (
    <div className="min-h-screen" style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}>
      {/* Header */}
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/youth">
              <Button variant="ghost" size="sm" className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />뒤로
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: "#FF8A3D" }} />
              <span className="text-xl font-bold text-gray-900">일정 관리</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* ── 왼쪽: 다이어리 캘린더 ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-3">
                <h2 className="text-gray-900 mb-0.5" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                  대화 일정 캘린더
                </h2>
                {/* 범례 */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded inline-block" style={{ backgroundColor: SCHEDULE_COLOR.bg }} />
                    <span style={{ fontSize: "0.75rem", color: SCHEDULE_COLOR.text }}>대화 일정</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded inline-block" style={{ backgroundColor: "#FFF4E6" }} />
                    <span style={{ fontSize: "0.75rem", color: "#FF8A3D" }}>가능 시간</span>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{ available: availableDates }}
                  className="rounded-md w-full"
                  classNames={{
                    months:     "flex flex-col w-full",
                    month:      "flex flex-col gap-2 w-full",
                    caption:    "flex justify-center pt-1 pb-2 relative items-center w-full",
                    caption_label: "text-sm font-semibold text-gray-800",
                    nav:        "flex items-center gap-1",
                    nav_button: "w-7 h-7 flex items-center justify-center rounded-xl hover:bg-orange-50 text-gray-500",
                    nav_button_previous: "absolute left-1",
                    nav_button_next:     "absolute right-1",
                    table:      "w-full border-collapse",
                    head_row:   "flex w-full justify-between",
                    head_cell:  "flex-1 text-xs text-gray-400 font-normal text-center py-1",
                    row:        "flex w-full justify-between border-t border-gray-100",
                    cell:       "flex-1 p-0 relative",
                    day:        "w-full p-0 font-normal rounded-none hover:bg-orange-50/60 transition-colors",
                    day_selected: "bg-orange-100/70 hover:bg-orange-100/70",
                    day_today:    "font-bold",
                    day_outside:  "opacity-30",
                  }}
                  components={{
                    IconLeft:   () => <ChevronLeft  className="w-4 h-4" />,
                    IconRight:  () => <ChevronRight className="w-4 h-4" />,
                    DayContent: ({ date }) => <CustomDayContent date={date} />,
                  }}
                />
              </div>

              {/* 가능 시간 / 일정 등록 버튼 */}
              <div className="px-5 pb-5 space-y-2">
                <button
                  className="w-full py-3 rounded-2xl text-white"
                  style={{ backgroundColor: "#FF8A3D", fontWeight: 700, fontSize: "0.95rem" }}
                  onClick={() => setAvailDialogOpen(true)}
                  disabled={!youthId}
                >
                  가능 시간 등록하기
                </button>
                <button
                  className="w-full py-3 rounded-2xl border flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ borderColor: SCHEDULE_COLOR.text, color: SCHEDULE_COLOR.text, backgroundColor: "white", fontWeight: 700, fontSize: "0.92rem" }}
                  onClick={openScheduleDialog}
                  disabled={!youthId}
                >
                  <CalendarPlus className="w-4 h-4" />
                  일정 만들기
                </button>
              </div>
            </div>

            {/* 알림 설정 */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF4E6" }}>
                  <Bell className="w-4 h-4" style={{ color: "#FF8A3D" }} />
                </div>
                <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1rem" }}>알림 설정</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: "#FFF4E6" }}>
                  <span className="text-gray-700" style={{ fontSize: "0.88rem" }}>대화 시작 10분 전 알림</span>
                  <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "#FF8A3D", color: "white", fontWeight: 600 }}>활성화</span>
                </div>
              </div>
            </div>

            {/* 대화 팁 */}
            <div className="rounded-3xl p-6" style={{ backgroundColor: "#FFF4E6" }}>
              <h3 className="text-gray-900 mb-3" style={{ fontWeight: 700, fontSize: "1rem" }}>💡 대화 팁</h3>
              <ul className="space-y-2">
                {["대화 전 조용한 환경을 준비하세요","천천히, 또박또박 말씀해주세요","어르신의 이야기를 경청해주세요","긍정적이고 밝은 태도를 유지하세요"].map((tip) => (
                  <li key={tip} className="flex gap-2.5 items-start">
                    <span style={{ color: "#FF8A3D", fontWeight: 700 }}>·</span>
                    <span className="text-gray-600" style={{ fontSize: "0.87rem" }}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── 오른쪽: 선택 날짜 상세 + 다가오는 일정 ── */}
          <div className="space-y-5">

            {/* 선택 날짜 세부 사항 */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
                    : "날짜를 선택하세요"}
                </h2>
                <button
                  onClick={() => { void loadAvailableTimes(); void loadSchedules(); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-orange-50"
                  style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  disabled={availLoading || scheduleLoading}
                  aria-label="새로고침"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${availLoading || scheduleLoading ? "animate-spin" : ""}`} />
                  새로고침
                </button>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* 일정 로딩/에러 */}
                {scheduleLoading ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span style={{ fontSize: "0.85rem" }}>일정을 불러오는 중...</span>
                  </div>
                ) : scheduleError ? (
                  <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFF1F1", border: "1.5px solid #FCA5A5" }}>
                    <p className="text-sm" style={{ color: "#B91C1C", fontWeight: 600 }}>{scheduleError}</p>
                    <button
                      onClick={() => void loadSchedules()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: "#FF8A3D", color: "white", fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      다시 시도
                    </button>
                  </div>
                ) : selectedDateSchedules.length > 0 ? (
                  selectedDateSchedules.map((s) => {
                    const { time: startTime } = splitLocalDateTime(s.scheduledStartAt);
                    const { time: endTime } = splitLocalDateTime(s.scheduledEndAt);
                    const isCanceled = s.status === "CANCELED";
                    const isCompleted = s.status === "COMPLETED";
                    const isActive = !isCanceled && !isCompleted;
                    const col = isCanceled
                      ? { bg: "#F3F4F6", text: "#9CA3AF" }
                      : SCHEDULE_COLOR;
                    const statusLabel =
                      s.status === "CONFIRMED" ? "확정"
                      : s.status === "PENDING" ? "대기중"
                      : s.status === "COMPLETED" ? "완료"
                      : "취소됨";
                    return (
                      <div key={s.scheduleId} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${col.bg}` }}>
                        <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: col.bg }}>
                          <div className="flex items-center gap-2">
                            <Video className="w-3.5 h-3.5" style={{ color: col.text }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: col.text }}>
                              대화 일정
                            </span>
                          </div>
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full"
                            style={s.status === "CONFIRMED"
                              ? { backgroundColor: "#7C6FD4", color: "white", fontWeight: 600 }
                              : isCanceled
                              ? { backgroundColor: "white", color: "#9CA3AF", fontWeight: 600 }
                              : { backgroundColor: "white",   color: "#9CA3AF", fontWeight: 600 }}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="px-4 py-3 flex items-center gap-3">
                          <span className="text-3xl leading-none">👵</span>
                          <div className="flex-1">
                            <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{s.elderName} 어르신</p>
                            <div className="flex items-center gap-1.5 mt-0.5" style={{ color: "#9CA3AF", fontSize: "0.82rem" }}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{startTime} ~ {endTime}</span>
                            </div>
                            {isCanceled && s.cancelReason && (
                              <p className="text-xs text-gray-400 mt-1">취소 사유: {s.cancelReason}</p>
                            )}
                          </div>
                        </div>

                        <div className="px-4 pb-4">
                          {isActive ? (
                            <div className="flex gap-2">
                              <button
                                className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5"
                                style={{ backgroundColor: "#FF8A3D", fontWeight: 600, fontSize: "0.85rem" }}
                                onClick={() =>
                                  navigate(
                                    `/youth/call?senior=${encodeURIComponent(s.elderName)}&type=video`,
                                  )
                                }
                              >
                                <Video className="w-4 h-4" />
                                화상 통화 시작
                              </button>
                              <button
                                className="px-4 py-2.5 rounded-xl border text-gray-500"
                                style={{ borderColor: "#E5E7EB", fontWeight: 600, fontSize: "0.85rem" }}
                                onClick={() => toast.message("일정 변경 기능은 다음 단계에서 연결 예정입니다.")}
                              >
                                변경
                              </button>
                              <button
                                className="px-4 py-2.5 rounded-xl border"
                                style={{ borderColor: "#FCA5A5", color: "#B91C1C", fontWeight: 600, fontSize: "0.85rem" }}
                                onClick={() =>
                                  setCancelTarget({
                                    scheduleId: s.scheduleId,
                                    label: `${s.elderName} 어르신 · ${startTime} ~ ${endTime}`,
                                  })
                                }
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              className="w-full py-2.5 rounded-xl border text-gray-400"
                              style={{ borderColor: "#E5E7EB", fontWeight: 600, fontSize: "0.85rem" }}
                              disabled
                            >
                              {isCanceled ? "취소된 일정" : "완료된 일정"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : null}

                {/* 가능 시간 영역 (FE-4A 백엔드 연동 유지) */}
                {availLoading ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span style={{ fontSize: "0.85rem" }}>가능 시간을 불러오는 중...</span>
                  </div>
                ) : availError ? (
                  <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: "#FFF1F1", border: "1.5px solid #FCA5A5" }}>
                    <p className="text-sm" style={{ color: "#B91C1C", fontWeight: 600 }}>{availError}</p>
                    <button
                      onClick={() => void loadAvailableTimes()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: "#FF8A3D", color: "white", fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      다시 시도
                    </button>
                  </div>
                ) : selectedDateTimes.length > 0 ? (
                  <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFF9F0", border: "1.5px solid #FFE4C8" }}>
                    <p className="mb-3" style={{ fontWeight: 600, fontSize: "0.82rem", color: "#92400E" }}>
                      🕐 내가 등록한 가능 시간
                    </p>
                    <div className="space-y-2">
                      {selectedDateTimes.map((at) => {
                        const { time: start } = splitLocalDateTime(at.startTime);
                        const { time: end } = splitLocalDateTime(at.endTime);
                        return (
                          <div
                            key={at.availableTimeId}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-2xl bg-white"
                            style={{ border: "1.5px solid #FFD4A8" }}
                          >
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              <Clock className="w-3.5 h-3.5" style={{ color: "#FF8A3D" }} />
                              <span style={{ color: "#FF8A3D", fontWeight: 700, fontSize: "0.85rem" }}>
                                {start} ~ {end}
                              </span>
                              {at.isBooked && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 600 }}
                                >
                                  예약됨
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-500 text-xs">
                                {at.isBooked ? "어르신 일정에 매칭된 시간" : "대화 가능 시간"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setDeleteAvailConfirm({
                                  availableTimeId: at.availableTimeId,
                                  label: `${start} ~ ${end}`,
                                })
                              }
                              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
                              aria-label="가능 시간 삭제"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  selectedDateSchedules.length === 0 && !scheduleLoading && !scheduleError && (
                    <div className="py-6 text-center" style={{ color: "#CBD5E1" }}>
                      <p style={{ fontSize: "2rem" }}>📭</p>
                      <p className="mt-2 text-gray-400" style={{ fontSize: "0.85rem" }}>
                        이 날 등록된 일정이 없어요
                      </p>
                      <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>
                        아래 "가능 시간 등록하기" 또는 "일정 만들기"로 추가해 보세요.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 다가오는 전체 일정 */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "1.05rem" }}>다가오는 일정</h2>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.82rem" }}>클릭하면 캘린더에서 확인할 수 있어요</p>
              <div className="space-y-2.5">
                {upcomingSchedules.length === 0 ? (
                  <p className="text-gray-400 text-sm py-4 text-center">예정된 일정이 없습니다.</p>
                ) : (
                  upcomingSchedules.map((s) => {
                    const d = new Date(s.date);
                    const col =
                      s.kind === "available"
                        ? { bg: "#FFF4E6", text: "#FF8A3D" }
                        : SCHEDULE_COLOR;
                    return (
                      <div
                        key={s.key}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:shadow-sm transition-shadow"
                        style={{ border: "1.5px solid #F3F4F6" }}
                        onClick={() => setSelectedDate(new Date(s.date))}
                      >
                        <span className="text-2xl leading-none">{s.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 truncate" style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                            {s.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5" style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>
                            <Clock className="w-3 h-3" />
                            <span>
                              {d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })} {s.time}
                            </span>
                          </div>
                        </div>
                        <div
                          className="shrink-0 px-2.5 py-1 rounded-lg text-xs"
                          style={{ backgroundColor: col.bg, color: col.text, fontWeight: 700 }}
                        >
                          {s.kind === "schedule" ? "일정" : "가능"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 가능 시간 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteAvailConfirm}
        title="가능 시간을 삭제하시겠습니까?"
        description={deleteAvailConfirm ? `${deleteAvailConfirm.label} 가능 시간이 삭제됩니다.` : undefined}
        confirmLabel="삭제"
        onConfirm={() => deleteAvailConfirm && handleRemoveAvailPlaceholder()}
        onCancel={() => setDeleteAvailConfirm(null)}
      />

      {/* 일정 취소 확인 */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="일정을 취소하시겠습니까?"
        description={cancelTarget ? `${cancelTarget.label} 일정이 취소됩니다.` : undefined}
        confirmLabel={isCanceling ? "취소 중..." : "일정 취소"}
        onConfirm={() => { void handleConfirmCancel(); }}
        onCancel={() => { if (!isCanceling) setCancelTarget(null); }}
      />

      {/* 가능 시간 등록 다이얼로그 */}
      <Dialog open={availDialogOpen} onOpenChange={(open) => { if (!isSubmittingAvail) setAvailDialogOpen(open); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>가능 시간 등록</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString("ko-KR")}에 활동 가능한 시간대를 등록하세요. 등록된 시간 안에서만 어르신과 일정을 잡을 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">시작 시간</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="시작" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">종료 시간</label>
                <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="종료" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter((t) => !selectedTime || t > selectedTime)
                      .map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">통화 유형 <span className="text-gray-400 font-normal">(참고용)</span></label>
              <div className="flex gap-2">
                {([["video", "영상 통화", "#6D28D9", "#EDE9FE"], ["voice", "음성 통화", "#065F46", "#D1FAE5"]] as const).map(([val, label, textColor, bgColor]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedType(val)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 text-sm transition-colors"
                    style={{
                      borderColor: selectedType === val ? textColor : "#E5E7EB",
                      backgroundColor: selectedType === val ? bgColor : "white",
                      color: selectedType === val ? textColor : "#6B7280",
                      fontWeight: selectedType === val ? 700 : 400,
                    }}
                  >
                    {val === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">매주 반복 등록</label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#FAF8F5" }}>
                <button
                  type="button"
                  onClick={() => setRepeatWeekly((v) => !v)}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                  style={{ backgroundColor: repeatWeekly ? "#FF8A3D" : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: repeatWeekly ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <span className="text-sm text-gray-700">같은 요일 · 시간으로</span>
                {repeatWeekly && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      min={2} max={12}
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.min(12, Math.max(2, Number(e.target.value))))}
                      className="w-14 px-2 py-1 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-orange-300"
                    />
                    <span className="text-sm text-gray-500">주</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">메모 <span className="text-gray-400 font-normal">(선택)</span></label>
              <textarea
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="대화 주제, 준비사항 등 개인 메모를 적어주세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-orange-300"
              />
              <p className="text-right text-xs text-gray-400 mt-1">{scheduleNote.length} / 200자</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleSubmitAvailability()}
                disabled={isSubmittingAvail}
                className="flex-1 py-3 rounded-2xl text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#FF8A3D", fontWeight: 700 }}
              >
                {isSubmittingAvail && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmittingAvail ? "등록 중..." : "등록하기"}
              </button>
              <button
                type="button"
                onClick={() => setAvailDialogOpen(false)}
                disabled={isSubmittingAvail}
                className="flex-1 py-3 rounded-2xl border text-gray-600 disabled:opacity-60"
                style={{ borderColor: "#E5E7EB", fontWeight: 600 }}
              >
                취소
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 일정 생성 다이얼로그 */}
      <Dialog open={scheduleDialogOpen} onOpenChange={(open) => { if (!isSubmittingSchedule) setScheduleDialogOpen(open); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>대화 일정 만들기</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString("ko-KR")}에 매칭된 어르신과의 대화 일정을 만듭니다. 양측 가능 시간이 겹치는 시간만 등록할 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">매칭된 어르신</label>
              {matchesLoading ? (
                <div className="flex items-center gap-2 text-gray-400 px-3 py-2.5 rounded-2xl border border-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">매칭 목록을 불러오는 중...</span>
                </div>
              ) : matchesError ? (
                <div className="rounded-2xl px-3 py-2.5 text-sm" style={{ backgroundColor: "#FFF1F1", border: "1.5px solid #FCA5A5", color: "#B91C1C" }}>
                  {matchesError}
                  <button
                    onClick={() => void loadMyMatches()}
                    className="ml-2 underline"
                    type="button"
                  >
                    다시 시도
                  </button>
                </div>
              ) : schedulableMatches.length === 0 ? (
                <div className="rounded-2xl px-3 py-2.5 text-sm text-gray-500" style={{ backgroundColor: "#FAF8F5", border: "1.5px solid #E5E7EB" }}>
                  일정 생성이 가능한 매칭이 없습니다. 먼저 어르신과 매칭을 진행해주세요.
                </div>
              ) : (
                <Select value={scheduleMatchId} onValueChange={setScheduleMatchId}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="어르신 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedulableMatches.map((m) => (
                      <SelectItem key={m.matchId} value={m.matchId}>
                        {m.elderName} 어르신
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">시작 시간</label>
                <Select value={scheduleStart} onValueChange={setScheduleStart}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="시작" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block text-gray-700">종료 시간</label>
                <Select value={scheduleEnd} onValueChange={setScheduleEnd}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="종료" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter((t) => !scheduleStart || t > scheduleStart)
                      .map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              {selectedDate?.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} 기준으로 등록됩니다. 날짜를 바꾸려면 캘린더에서 다른 날짜를 먼저 선택해주세요.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleSubmitSchedule()}
                disabled={isSubmittingSchedule || schedulableMatches.length === 0}
                className="flex-1 py-3 rounded-2xl text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: SCHEDULE_COLOR.text, fontWeight: 700 }}
              >
                {isSubmittingSchedule && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmittingSchedule ? "등록 중..." : "일정 만들기"}
              </button>
              <button
                type="button"
                onClick={() => setScheduleDialogOpen(false)}
                disabled={isSubmittingSchedule}
                className="flex-1 py-3 rounded-2xl border text-gray-600 disabled:opacity-60"
                style={{ borderColor: "#E5E7EB", fontWeight: 600 }}
              >
                취소
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
