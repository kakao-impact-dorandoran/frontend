import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Heart, ArrowLeft, Clock, Video, Phone, Bell, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";

const mockSchedules: { id: number; seniorName: string; avatar: string; date: string; time: string; type: string; status: string }[] = [
  { id: 1, seniorName: "김복순 어르신", avatar: "👵", date: "2026-05-25", time: "15:00", type: "video", status: "confirmed" },
  { id: 2, seniorName: "김복순 어르신", avatar: "👵", date: "2026-06-03", time: "14:00", type: "voice", status: "confirmed" },
];

const timeSlots = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","19:00","20:00"];

const shortName = (full: string) => full.replace(" 어르신", "");
const typeColor = (type: string) =>
  type === "video" ? { bg: "#EDE9FE", text: "#6D28D9" } : { bg: "#D1FAE5", text: "#065F46" };

// 매칭된 어르신 목록 (데모)
const MATCHED_SENIORS = [
  { id: 1, name: "김복순 어르신", defaultType: "video" as const },
];

type ScheduleSlot = { time: string; type: "video" | "voice"; note: string; seniorName: string; auto?: boolean };

// 매칭 수락 시 자동 입력된 시간대 (데모: 김복순 어르신 - 매주 일요일 15:00 영상)
const AUTO_SLOTS: Record<string, ScheduleSlot[]> = {
  "2026-05-24": [{ time: "15:00", type: "video", note: "매칭 시 자동 등록", seniorName: "김복순 어르신", auto: true }],
  "2026-05-31": [{ time: "15:00", type: "video", note: "매칭 시 자동 등록", seniorName: "김복순 어르신", auto: true }],
  "2026-06-07": [{ time: "15:00", type: "video", note: "매칭 시 자동 등록", seniorName: "김복순 어르신", auto: true }],
  "2026-06-14": [{ time: "15:00", type: "video", note: "매칭 시 자동 등록", seniorName: "김복순 어르신", auto: true }],
};

export default function YouthSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState<"video" | "voice">("video");
  const [selectedSenior, setSelectedSenior] = useState(MATCHED_SENIORS[0].name);
  const [scheduleNote, setScheduleNote] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatCount, setRepeatCount]   = useState(4);
  const [availability, setAvailability] = useState<Record<string, ScheduleSlot[]>>(AUTO_SLOTS);
  const [deleteConfirm, setDeleteConfirm] = useState<{ dateStr: string; time: string } | null>(null);
  const navigate = useNavigate();

  const dateKey = (d: Date) => {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  // 날짜 → 일정 맵
  const scheduleByDate: Record<string, typeof mockSchedules> = {};
  mockSchedules.forEach((s) => {
    if (!scheduleByDate[s.date]) scheduleByDate[s.date] = [];
    scheduleByDate[s.date].push(s);
  });

  const availableDates = Object.keys(availability)
    .filter((k) => availability[k].length > 0)
    .map((k) => new Date(k));

  const addSlot = (prev: Record<string, ScheduleSlot[]>, key: string, slot: ScheduleSlot) => {
    const existing = prev[key] ?? [];
    if (existing.some((s) => s.time === slot.time && s.seniorName === slot.seniorName)) return prev;
    const sorted = [...existing, slot].sort((a, b) => a.time.localeCompare(b.time));
    return { ...prev, [key]: sorted };
  };

  const handleAddSchedule = () => {
    if (!selectedDate || !selectedTime) { toast.error("날짜와 시간을 선택해주세요"); return; }
    if (!selectedSenior) { toast.error("어르신을 선택해주세요"); return; }

    const slot: ScheduleSlot = { time: selectedTime, type: selectedType, note: scheduleNote.trim(), seniorName: selectedSenior };

    setAvailability((prev) => {
      let next = { ...prev };
      const dates: Date[] = [];
      for (let i = 0; i < (repeatWeekly ? repeatCount : 1); i++) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + i * 7);
        dates.push(d);
      }
      dates.forEach((d) => { next = addSlot(next, dateKey(d), slot); });
      return next;
    });

    const label = repeatWeekly ? `${repeatCount}주 일괄` : selectedDate.toLocaleDateString("ko-KR");
    toast.success(`${label} ${selectedTime} 등록 완료!`);
    setSelectedTime(""); setSelectedType("video"); setScheduleNote(""); setRepeatWeekly(false); setRepeatCount(4);
    setDialogOpen(false);
  };

  const handleRemoveTime = (dateStr: string, time: string) => {
    setAvailability((prev) => {
      const updated = (prev[dateStr] ?? []).filter((s) => s.time !== time);
      if (updated.length === 0) { const next = { ...prev }; delete next[dateStr]; return next; }
      return { ...prev, [dateStr]: updated };
    });
    toast.success(`${time} 일정이 삭제되었습니다.`);
    setDeleteConfirm(null);
  };

  const selectedDateKey       = selectedDate ? dateKey(selectedDate) : "";
  const selectedDateTimes     = availability[selectedDateKey] ?? [];
  const selectedDateSchedules = scheduleByDate[selectedDateKey] ?? [];

  // ── 캘린더 셀 커스텀 ──────────────────────────────────────
  const CustomDayContent = ({ date }: { date: Date }) => {
    const key        = dateKey(date);
    const dayScheds  = scheduleByDate[key] ?? [];
    const hasAvail   = (availability[key]?.length ?? 0) > 0;

    return (
      <div
        className="flex flex-col items-start w-full px-1 pt-1 pb-1 gap-0.5"
        style={{ minHeight: "3.8rem" }}
      >
        {/* 날짜 숫자 */}
        <span className="w-full text-center leading-none mb-0.5" style={{ fontSize: "0.82rem" }}>
          {date.getDate()}
        </span>

        {/* 어르신 일정 칩 */}
        {dayScheds.map((s) => {
          const col = typeColor(s.type);
          return (
            <div
              key={s.id}
              className="w-full rounded-md truncate"
              style={{
                backgroundColor: col.bg,
                color: col.text,
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "1px 4px",
                lineHeight: "1.4",
              }}
            >
              {shortName(s.seniorName)}
            </div>
          );
        })}

        {/* 수기/자동 등록 일정 칩 */}
        {(availability[key] ?? []).map((slot) => {
          const col = typeColor(slot.type);
          return (
            <div
              key={slot.time + slot.seniorName}
              className="w-full rounded-md truncate"
              style={{
                backgroundColor: col.bg,
                color: col.text,
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "1px 4px",
                lineHeight: "1.4",
              }}
            >
              {shortName(slot.seniorName)}
            </div>
          );
        })}
      </div>
    );
  };

  // 다가오는 전체 일정 (mockSchedules + 수기 등록, 오늘 이후)
  const todayKey = dateKey(new Date());
  const availabilityFlat = Object.entries(availability)
    .filter(([k]) => k >= todayKey)
    .flatMap(([date, slots]) =>
      slots.map((s) => ({
        id: `${date}-${s.time}-${s.seniorName}`,
        seniorName: s.seniorName,
        avatar: "👵",
        date,
        time: s.time,
        type: s.type,
        status: "confirmed",
      }))
    );
  const upcomingSchedules = [...mockSchedules.filter((s) => s.date >= todayKey), ...availabilityFlat]
    .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1))
    .slice(0, 8);

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
                    <span className="w-3 h-2.5 rounded inline-block" style={{ backgroundColor: "#EDE9FE" }} />
                    <span style={{ fontSize: "0.75rem", color: "#6D28D9" }}>영상 통화</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded inline-block" style={{ backgroundColor: "#D1FAE5" }} />
                    <span style={{ fontSize: "0.75rem", color: "#065F46" }}>음성 통화</span>
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

              {/* 일정 등록 버튼 */}
              <div className="px-5 pb-5">
                <button
                  className="w-full py-3 rounded-2xl text-white"
                  style={{ backgroundColor: "#FF8A3D", fontWeight: 700, fontSize: "0.95rem" }}
                  onClick={() => setDialogOpen(true)}
                >
                  일정 등록하기
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
              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  {selectedDate
                    ? selectedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })
                    : "날짜를 선택하세요"}
                </h2>
              </div>

              <div className="px-6 py-4 space-y-3">
                {/* 대화 일정 */}
                {selectedDateSchedules.length > 0 ? (
                  selectedDateSchedules.map((s) => {
                    const col = typeColor(s.type);
                    return (
                      <div key={s.id} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${col.bg}` }}>
                        {/* 컬러 헤더 바 */}
                        <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: col.bg }}>
                          <div className="flex items-center gap-2">
                            {s.type === "video"
                              ? <Video  className="w-3.5 h-3.5" style={{ color: col.text }} />
                              : <Phone  className="w-3.5 h-3.5" style={{ color: col.text }} />}
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: col.text }}>
                              {s.type === "video" ? "영상 통화 (페이스톡)" : "음성 통화 (보이스톡)"}
                            </span>
                          </div>
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full"
                            style={s.status === "confirmed"
                              ? { backgroundColor: "#7C6FD4", color: "white", fontWeight: 600 }
                              : { backgroundColor: "white",   color: "#9CA3AF", fontWeight: 600 }}
                          >
                            {s.status === "confirmed" ? "확정" : "대기중"}
                          </span>
                        </div>

                        {/* 어르신 정보 */}
                        <div className="px-4 py-3 flex items-center gap-3">
                          <span className="text-3xl leading-none">{s.avatar}</span>
                          <div className="flex-1">
                            <p className="text-gray-900" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{s.seniorName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5" style={{ color: "#9CA3AF", fontSize: "0.82rem" }}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{s.time}</span>
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="px-4 pb-4">
                          {s.status === "confirmed" ? (
                            <div className="flex gap-2">
                              <button
                                className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-1.5"
                                style={{ backgroundColor: "#FF8A3D", fontWeight: 600, fontSize: "0.85rem" }}
                              onClick={() => navigate(`/youth/call?senior=${encodeURIComponent(s.seniorName)}&type=${s.type === "video" ? "video" : "voice"}`)}
                              >
                                {s.type === "video" ? <><Video className="w-4 h-4" />화상 통화 시작</> : <><Phone className="w-4 h-4" />음성 통화 시작</>}
                              </button>
                              <button
                                className="px-4 py-2.5 rounded-xl border text-gray-500"
                                style={{ borderColor: "#E5E7EB", fontWeight: 600, fontSize: "0.85rem" }}
                              >
                                변경
                              </button>
                            </div>
                          ) : (
                            <button
                              className="w-full py-2.5 rounded-xl border text-gray-400"
                              style={{ borderColor: "#E5E7EB", fontWeight: 600, fontSize: "0.85rem" }}
                            >
                              일정 조율 중
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  selectedDateTimes.length === 0 && (
                    <div className="py-6 text-center" style={{ color: "#CBD5E1" }}>
                      <p style={{ fontSize: "2rem" }}>📭</p>
                      <p className="mt-2 text-gray-400" style={{ fontSize: "0.85rem" }}>이 날 예정된 대화가 없어요</p>
                    </div>
                  )
                )}

                {/* 내 등록 일정 */}
                {selectedDateTimes.length > 0 && (
                  <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFF9F0", border: "1.5px solid #FFE4C8" }}>
                    <p className="mb-3" style={{ fontWeight: 600, fontSize: "0.82rem", color: "#92400E" }}>
                      🕐 내가 등록한 일정
                    </p>
                    <div className="space-y-2">
                      {selectedDateTimes.map((slot) => (
                        <div
                          key={slot.time + slot.seniorName}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-2xl bg-white"
                          style={{ border: "1.5px solid #FFD4A8" }}
                        >
                          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                            {slot.type === "video"
                              ? <Video className="w-3.5 h-3.5" style={{ color: "#6D28D9" }} />
                              : <Phone className="w-3.5 h-3.5" style={{ color: "#065F46" }} />}
                            <span style={{ color: "#FF8A3D", fontWeight: 700, fontSize: "0.85rem" }}>{slot.time}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={slot.type === "video" ? { backgroundColor: "#EDE9FE", color: "#6D28D9", fontWeight: 600 } : { backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 600 }}>
                              {slot.type === "video" ? "영상" : "음성"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 text-xs font-semibold">{slot.seniorName}</p>
                            {slot.auto && <p className="text-gray-400 text-xs">매칭 시 자동 등록</p>}
                            {!slot.auto && slot.note && <p className="text-gray-500 text-xs truncate">{slot.note}</p>}
                          </div>
                          <button
                            onClick={() => setDeleteConfirm({ dateStr: selectedDateKey, time: slot.time })}
                            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 다가오는 전체 일정 */}
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-gray-900 mb-1" style={{ fontWeight: 700, fontSize: "1.05rem" }}>다가오는 대화</h2>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.82rem" }}>클릭하면 캘린더에서 확인할 수 있어요</p>
              <div className="space-y-2.5">
                {upcomingSchedules.map((s) => {
                  const d   = new Date(s.date);
                  const col = typeColor(s.type);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:shadow-sm transition-shadow"
                      style={{ border: "1.5px solid #F3F4F6" }}
                      onClick={() => setSelectedDate(new Date(s.date))}
                    >
                      <span className="text-2xl leading-none">{s.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 truncate" style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                          {s.seniorName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5" style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>
                          <Clock className="w-3 h-3" />
                          <span>{d.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })} {s.time}</span>
                        </div>
                      </div>
                      <div
                        className="shrink-0 px-2.5 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: col.bg, color: col.text, fontWeight: 700 }}
                      >
                        {s.type === "video" ? "영상" : "음성"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="일정을 삭제하시겠습니까?"
        description={deleteConfirm ? `${deleteConfirm.time} 일정이 삭제됩니다.` : undefined}
        confirmLabel="삭제"
        onConfirm={() => deleteConfirm && handleRemoveTime(deleteConfirm.dateStr, deleteConfirm.time)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* 일정 등록 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>일정 등록</DialogTitle>
            <DialogDescription>
              {selectedDate?.toLocaleDateString("ko-KR")}에 등록할 일정을 입력하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">어르신 선택</label>
              <Select value={selectedSenior} onValueChange={setSelectedSenior}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="어르신을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {MATCHED_SENIORS.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">시간 선택</label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="시간을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block text-gray-700">통화 유형</label>
              <div className="flex gap-2">
                {([["video", "영상 통화", "#6D28D9", "#EDE9FE"], ["voice", "음성 통화", "#065F46", "#D1FAE5"]] as const).map(([val, label, textColor, bgColor]) => (
                  <button
                    key={val}
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
                onClick={handleAddSchedule}
                className="flex-1 py-3 rounded-2xl text-white"
                style={{ backgroundColor: "#FF8A3D", fontWeight: 700 }}
              >
                등록하기
              </button>
              <button
                onClick={() => setDialogOpen(false)}
                className="flex-1 py-3 rounded-2xl border text-gray-600"
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
