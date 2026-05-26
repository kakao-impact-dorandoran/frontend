import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Heart, ArrowLeft, Pencil, ChevronDown, ChevronUp, Check, X, BookOpen,
  Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../lib/api/client";
import {
  createActivityRecord,
  getActivityRecords,
} from "../../lib/api/activityRecord";
import { getMyMatches } from "../../lib/api/matching";
import { getMySchedules } from "../../lib/api/schedule";
import type {
  ActivityRecordSummaryResponse,
  MatchSummaryResponse,
  ScheduleResponse,
} from "../../types/api";
import { ErrorCode } from "../../types/api";
import { useAuth } from "../../lib/auth/AuthContext";

const DURATION_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function splitLocalDateTime(value: string | null): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date = "", rest = ""] = value.split("T");
  return { date, time: rest.slice(0, 5) };
}

function parseLocalDateTime(value: string | null): Date | null {
  if (!value) return null;
  const { date, time } = splitLocalDateTime(value);
  const [y, m, d] = date.split("-").map((n) => Number(n));
  const [hh, mm] = time.split(":").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

function formatActivityDate(record: ActivityRecordSummaryResponse): string {
  const base = record.actualStartAt ?? record.createdAt;
  const dt = parseLocalDateTime(base);
  if (!dt) return base;
  return DURATION_FORMATTER.format(dt);
}

function diffMinutes(startStr: string, endStr: string): number {
  const s = parseLocalDateTime(startStr);
  const e = parseLocalDateTime(endStr);
  if (!s || !e) return 0;
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000));
}

function formatScheduleLabel(s: ScheduleResponse): string {
  const { date, time: start } = splitLocalDateTime(s.scheduledStartAt);
  const { time: end } = splitLocalDateTime(s.scheduledEndAt);
  return `${s.elderName} 어르신 · ${date} ${start}~${end}`;
}

function resolveListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "프로필이 반려되어 활동 기록을 이용할 수 없습니다.";
      return err.message || "활동 기록을 조회할 권한이 없습니다.";
    }
    return err.message || "활동 기록을 불러오지 못했습니다.";
  }
  return "활동 기록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveCreateError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.ACTIVITY_RECORD_DUPLICATED:
        return "이 일정에는 이미 활동 기록이 등록되어 있습니다.";
      case ErrorCode.ACTIVITY_RECORD_DUPLICATED_CALL_LOG:
        return "이 통화에는 이미 활동 기록이 등록되어 있습니다.";
      case ErrorCode.INVALID_ACTIVITY_DURATION:
        return "활동 시간이 올바르지 않습니다. 시작/종료 시간 또는 분 단위를 확인해 주세요.";
      case ErrorCode.CALL_LOG_NOT_COMPLETED:
        return "통화가 아직 종료되지 않아 기록할 수 없습니다.";
      case ErrorCode.ACTIVITY_SCHEDULE_MISMATCH:
        return "선택한 일정이 해당 매칭에 속하지 않습니다.";
      case ErrorCode.ACTIVITY_CALL_LOG_MISMATCH:
        return "선택한 통화가 해당 매칭에 속하지 않습니다.";
      case ErrorCode.ACTIVITY_MATCH_NOT_RECORDABLE:
        return "현재 상태에서는 활동을 기록할 수 없는 매칭입니다.";
      case ErrorCode.INVALID_INPUT:
        return err.message || "입력값을 확인해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "프로필이 반려되어 활동 기록을 저장할 수 없습니다.";
      return err.message || "활동 기록을 저장할 권한이 없습니다.";
    }
    if (err.status === 404) return err.message || "관련 매칭/일정을 찾을 수 없습니다.";
    return err.message || "활동 기록을 저장하지 못했습니다.";
  }
  return "활동 기록을 저장하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

const NOTES_MAX = 500;

export default function YouthActivityJournal() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillCallLogId = searchParams.get("callLogId");
  const prefillScheduleId = searchParams.get("scheduleId");
  const prefillDuration = searchParams.get("durationMinutes");

  const [records, setRecords] = useState<ActivityRecordSummaryResponse[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchSummaryResponse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [refsLoading, setRefsLoading] = useState(false);
  const [refsError, setRefsError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [scheduleId, setScheduleId] = useState<string>("");
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [durationInput, setDurationInput] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setRecordsError(null);
      setRecordsLoading(false);
      return;
    }
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const list = await getActivityRecords();
      setRecords(list ?? []);
    } catch (err) {
      setRecords([]);
      setRecordsError(resolveListError(err));
    } finally {
      setRecordsLoading(false);
    }
  }, [user]);

  const loadRefs = useCallback(async () => {
    if (!user) {
      setMatches([]);
      setSchedules([]);
      setRefsError(null);
      setRefsLoading(false);
      return;
    }
    setRefsLoading(true);
    setRefsError(null);
    try {
      const [m, s] = await Promise.all([getMyMatches(), getMySchedules()]);
      setMatches(m ?? []);
      setSchedules(s ?? []);
    } catch (err) {
      setMatches([]);
      setSchedules([]);
      setRefsError(resolveListError(err));
    } finally {
      setRefsLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);
  useEffect(() => { void loadRefs(); }, [loadRefs]);

  const recordedScheduleIds = useMemo(
    () => new Set(records.map((r) => r.scheduleId)),
    [records],
  );

  const recordableMatchIds = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (m.status === "MATCHED" || m.status === "IN_PROGRESS" || m.status === "ENDED") {
        set.add(m.matchId);
      }
    }
    return set;
  }, [matches]);

  const recordableSchedules = useMemo(() => {
    return schedules
      .filter((s) => recordableMatchIds.has(s.matchId))
      .filter((s) => !recordedScheduleIds.has(s.scheduleId))
      .filter((s) => s.status === "CONFIRMED" || s.status === "COMPLETED")
      .slice()
      .sort((a, b) => b.scheduledStartAt.localeCompare(a.scheduledStartAt));
  }, [schedules, recordableMatchIds, recordedScheduleIds]);

  const selectedSchedule = useMemo(
    () => recordableSchedules.find((s) => s.scheduleId === scheduleId) ?? null,
    [recordableSchedules, scheduleId],
  );

  useEffect(() => {
    if (!writing) return;
    if (scheduleId && recordableSchedules.some((s) => s.scheduleId === scheduleId)) return;
    setScheduleId(recordableSchedules[0]?.scheduleId ?? "");
  }, [writing, recordableSchedules, scheduleId]);

  useEffect(() => {
    if (refsLoading) return;
    if (!prefillCallLogId && !prefillScheduleId && !prefillDuration) return;
    setWriting(true);
    if (prefillCallLogId) setCallLogId(prefillCallLogId);
    if (prefillScheduleId && recordableSchedules.some((s) => s.scheduleId === prefillScheduleId)) {
      setScheduleId(prefillScheduleId);
    }
    if (prefillDuration && /^\d+$/.test(prefillDuration)) {
      setDurationInput(prefillDuration);
    }
    const next = new URLSearchParams(searchParams);
    next.delete("callLogId");
    next.delete("matchId");
    next.delete("scheduleId");
    next.delete("durationMinutes");
    setSearchParams(next, { replace: true });
  }, [
    refsLoading,
    prefillCallLogId,
    prefillScheduleId,
    prefillDuration,
    recordableSchedules,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!selectedSchedule) {
      setDurationInput("");
      return;
    }
    const minutes = diffMinutes(selectedSchedule.scheduledStartAt, selectedSchedule.scheduledEndAt);
    if (minutes > 0) setDurationInput(String(minutes));
  }, [selectedSchedule]);

  const resetForm = useCallback(() => {
    setWriting(false);
    setScheduleId("");
    setCallLogId(null);
    setDurationInput("");
    setNotes("");
  }, []);

  const openWriter = useCallback(() => {
    setWriting(true);
    setNotes("");
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedSchedule) {
      toast.error("일정을 선택해 주세요.");
      return;
    }
    const trimmedNotes = notes.trim();
    const duration = Number(durationInput);
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("대화 시간(분)을 1 이상으로 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await createActivityRecord({
        matchId: selectedSchedule.matchId,
        scheduleId: selectedSchedule.scheduleId,
        callLogId: callLogId ?? null,
        isCompleted: true,
        durationMinutes: Math.round(duration),
        notes: trimmedNotes ? trimmedNotes : null,
      });
      toast.success("활동 일지가 저장되었습니다.");
      resetForm();
      await loadRecords();
    } catch (err) {
      toast.error(resolveCreateError(err));
    } finally {
      setSubmitting(false);
    }
  }, [selectedSchedule, notes, durationInput, callLogId, resetForm, loadRecords]);

  const totalRecordedMinutes = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
  }, [records]);

  const todayDateKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/youth">
              <Button variant="ghost" size="sm" className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
              <span className="text-xl font-bold text-gray-900">활동 일지</span>
            </div>
            <button
              type="button"
              onClick={() => { void loadRecords(); void loadRefs(); }}
              disabled={recordsLoading || refsLoading}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-orange-50"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
              aria-label="활동 기록 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(recordsLoading || refsLoading) ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "총 작성한 일지", value: `${records.length}개` },
            { label: "누적 대화 시간", value: `${totalRecordedMinutes}분` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl px-4 py-3 text-center shadow-sm">
              <p className="font-bold text-gray-900" style={{ fontSize: '1.1rem' }}>{stat.value}</p>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.75rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {!writing && (
          <button
            onClick={openWriter}
            disabled={refsLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mb-6 text-white disabled:opacity-60"
            style={{ backgroundColor: '#FF8A3D', fontWeight: 600 }}
          >
            <Pencil className="w-4 h-4" />
            새 활동 일지 작성
          </button>
        )}

        {writing && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-gray-900">새 활동 일지</p>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {refsLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ fontSize: '0.88rem' }}>일정 정보를 불러오는 중...</span>
              </div>
            ) : refsError ? (
              <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
                <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{refsError}</p>
                <button
                  onClick={() => void loadRefs()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: '#FF8A3D', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 시도
                </button>
              </div>
            ) : recordableSchedules.length === 0 ? (
              <div className="rounded-2xl p-5 text-center text-gray-500" style={{ backgroundColor: '#FAF8F5', border: '1.5px dashed #E5E7EB' }}>
                <p className="font-semibold mb-1" style={{ fontSize: '0.9rem' }}>기록할 수 있는 일정이 없어요</p>
                <p style={{ fontSize: '0.78rem' }} className="text-gray-400">
                  확정/완료된 일정만 활동 기록을 남길 수 있어요. 이미 기록한 일정은 다시 작성할 수 없습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">일정 선택</p>
                    <Select value={scheduleId} onValueChange={(v) => setScheduleId(v)}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="일정을 선택해 주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {recordableSchedules.map((s) => (
                          <SelectItem key={s.scheduleId} value={s.scheduleId}>
                            {formatScheduleLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">대화 시간(분)</p>
                    <input
                      type="number"
                      value={durationInput}
                      onChange={(e) => setDurationInput(e.target.value)}
                      placeholder="예) 30"
                      min={1}
                      className="w-full px-3 py-2 rounded-2xl border text-sm focus:outline-none focus:border-orange-300"
                      style={{ borderColor: '#E5E7EB' }}
                    />
                  </div>
                </div>

                {selectedSchedule && (
                  <div className="rounded-2xl px-3 py-2.5 mb-4" style={{ backgroundColor: '#FFF4E6' }}>
                    <p className="text-gray-700" style={{ fontSize: '0.82rem' }}>
                      <span className="font-semibold">{selectedSchedule.elderName}</span> 어르신과의{' '}
                      {selectedSchedule.scheduledStartAt.slice(0, 10)} 일정에 대한 기록입니다.
                    </p>
                    {callLogId && (
                      <p className="text-gray-500 mt-1" style={{ fontSize: '0.72rem' }}>
                        통화 기록 연결됨 · ID <span className="font-mono">{callLogId.slice(0, 8)}</span>
                      </p>
                    )}
                  </div>
                )}

                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                  placeholder="오늘 대화에서 기억에 남는 순간, 느낀 점, 다음에 이야기하고 싶은 것 등을 자유롭게 적어주세요."
                  className="rounded-2xl resize-none mb-1"
                  rows={5}
                  disabled={submitting}
                />
                <p className="text-right text-gray-400 mb-4" style={{ fontSize: '0.75rem' }}>{notes.length} / {NOTES_MAX}자</p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => void handleSave()}
                    disabled={submitting || !selectedSchedule}
                    className="flex-1 rounded-2xl"
                    style={{ backgroundColor: '#FF8A3D' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        저장하기
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm} disabled={submitting} className="rounded-2xl px-6">
                    취소
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {recordsLoading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span style={{ fontSize: '0.9rem' }}>활동 기록을 불러오는 중...</span>
          </div>
        ) : recordsError ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFF1F1', border: '1.5px solid #FCA5A5' }}>
              <p className="text-sm" style={{ color: '#B91C1C', fontWeight: 600 }}>{recordsError}</p>
              <button
                onClick={() => void loadRecords()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: '#FF8A3D', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 시도
              </button>
            </div>
          </div>
        ) : records.length > 0 ? (
          <div className="space-y-3">
            {records.map((entry) => {
              const dateText = formatActivityDate(entry);
              const isToday = entry.actualStartAt?.slice(0, 10) === todayDateKey
                || entry.createdAt.slice(0, 10) === todayDateKey;
              const minutesText = entry.durationMinutes != null ? `${entry.durationMinutes}분` : "-";
              return (
                <div key={entry.activityRecordId} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === entry.activityRecordId ? null : entry.activityRecordId)}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
                      👴
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900" style={{ fontSize: '0.95rem' }}>
                        {entry.elderName} 어르신
                        {isToday && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#FFF4E6', color: '#C2410C', fontWeight: 600 }}>오늘</span>
                        )}
                      </p>
                      <p className="text-gray-500" style={{ fontSize: '0.78rem' }}>
                        {dateText} · {minutesText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {expandedId === entry.activityRecordId
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {expandedId === entry.activityRecordId && (
                    <div className="px-5 pb-5">
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#FAF8F5' }}>
                        {entry.notes ? (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontSize: '0.88rem' }}>{entry.notes}</p>
                        ) : (
                          <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>작성된 메모가 없어요.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          !writing && (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF4E6' }}>
                <BookOpen className="w-8 h-8" style={{ color: '#FF8A3D' }} />
              </div>
              <p className="text-gray-700 font-semibold mb-1">아직 작성된 일지가 없어요</p>
              <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>대화 후 소감을 기록해보세요</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
