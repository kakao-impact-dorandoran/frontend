import { Link, useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, User, Users, Calendar, LogOut, MessageCircle, Bell, ChevronRight,
  Clock, Award, Phone, Pencil,
} from "lucide-react";
import { NotificationPanel } from "../components/NotificationPanel";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAuth } from "../../lib/auth/AuthContext";
import { ApiError } from "../../lib/api/client";
import {
  getActivityRecords,
  getMyVolunteerStats,
} from "../../lib/api/activityRecord";
import { getMyMatches } from "../../lib/api/matching";
import { getMySchedules } from "../../lib/api/schedule";
import type {
  ActivityRecordSummaryResponse,
  MatchSummaryResponse,
  ScheduleResponse,
  YouthVolunteerStatsResponse,
} from "../../types/api";
import { toast } from "sonner";

function splitLocalDateTime(value: string): { date: string; time: string } {
  const [date = "", rest = ""] = value.split("T");
  return { date, time: rest.slice(0, 5) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const SCHEDULE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
});

function formatScheduleTime(s: ScheduleResponse): string {
  const { date, time: start } = splitLocalDateTime(s.scheduledStartAt);
  const { time: end } = splitLocalDateTime(s.scheduledEndAt);
  const [y, m, d] = date.split("-").map((n) => Number(n));
  if (!y || !m || !d) return `${date} ${start} ~ ${end}`;
  return `${SCHEDULE_FORMATTER.format(new Date(y, m - 1, d))} ${start} ~ ${end}`;
}

function isSilentApiError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export default function YouthDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName = user?.name ?? "청년";
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const unreadCount = 2;

  const [stats, setStats] = useState<YouthVolunteerStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [matches, setMatches] = useState<MatchSummaryResponse[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const [activityRecords, setActivityRecords] = useState<ActivityRecordSummaryResponse[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const data = await getMyVolunteerStats();
      setStats(data);
    } catch (err) {
      setStats(null);
      if (!isSilentApiError(err)) {
        toast.error("누적 활동 통계를 불러오지 못했습니다.");
      }
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setMatchesLoading(true);
    try {
      const list = await getMyMatches();
      setMatches(list ?? []);
    } catch {
      setMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }, [user]);

  const loadActivityRecords = useCallback(async () => {
    if (!user) return;
    setActivityLoading(true);
    try {
      const list = await getActivityRecords();
      setActivityRecords(list ?? []);
    } catch {
      setActivityRecords([]);
    } finally {
      setActivityLoading(false);
    }
  }, [user]);

  const loadSchedules = useCallback(async () => {
    if (!user) return;
    setSchedulesLoading(true);
    try {
      const list = await getMySchedules();
      setSchedules(list ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void loadMatches(); }, [loadMatches]);
  useEffect(() => { void loadActivityRecords(); }, [loadActivityRecords]);
  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }, []);

  const thisMonthConversationCount = useMemo(() => {
    return activityRecords.filter((r) => {
      const base = r.actualStartAt ?? r.createdAt;
      return base.startsWith(currentMonthKey);
    }).length;
  }, [activityRecords, currentMonthKey]);

  const activeSeniorCount = useMemo(() => {
    const elderIds = new Set<string>();
    for (const m of matches) {
      if (m.status === "MATCHED" || m.status === "IN_PROGRESS") {
        elderIds.add(m.elderId);
      }
    }
    return elderIds.size;
  }, [matches]);

  const totalMinutesText = stats != null
    ? `${stats.totalDurationMinutes}분`
    : (statsLoading ? "..." : "0분");
  const totalCertifiedHoursText = stats != null
    ? `${stats.totalCertifiedHours}시간`
    : (statsLoading ? "..." : "0시간");
  const availableCertificateHoursText = stats != null
    ? `${stats.availableCertificateHours}시간`
    : (statsLoading ? "..." : "0시간");
  const thisMonthCountText = activityLoading && activityRecords.length === 0
    ? "..."
    : `${thisMonthConversationCount}회`;
  const activeSeniorCountText = matchesLoading && matches.length === 0
    ? "..."
    : `${activeSeniorCount}명`;

  const upcomingSchedules = useMemo(() => {
    const now = new Date();
    return schedules
      .filter((s) => s.status === "PENDING" || s.status === "CONFIRMED")
      .filter((s) => {
        const { date, time } = splitLocalDateTime(s.scheduledStartAt);
        const [y, m, d] = date.split("-").map((n) => Number(n));
        const [hh, mm] = time.split(":").map((n) => Number(n));
        if (!y || !m || !d) return true;
        return new Date(y, m - 1, d, hh || 0, mm || 0).getTime() >= now.getTime();
      })
      .slice()
      .sort((a, b) => a.scheduledStartAt.localeCompare(b.scheduledStartAt))
      .slice(0, 3);
  }, [schedules]);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      {/* Header */}
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
              <span className="text-xl font-bold text-gray-900">도란도란</span>
            </Link>
            <div className="flex items-center gap-3 relative">
              <button
                ref={bellRef}
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4E6' }}>
                <Bell className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400" />
                )}
              </button>
              <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                anchorRef={bellRef}
              />
              <button
                onClick={() => setLogoutConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Banner */}
        <style>{`
          @keyframes drift1{0%{transform:translate(0,0)}20%{transform:translate(30px,-40px)}40%{transform:translate(-20px,-60px)}60%{transform:translate(-50px,-20px)}80%{transform:translate(20px,10px)}100%{transform:translate(0,0)}}
          @keyframes drift2{0%{transform:translate(0,0)}25%{transform:translate(-40px,30px)}50%{transform:translate(30px,50px)}75%{transform:translate(50px,-10px)}100%{transform:translate(0,0)}}
          @keyframes drift3{0%{transform:translate(0,0)}30%{transform:translate(-50px,-30px)}60%{transform:translate(40px,-50px)}100%{transform:translate(0,0)}}
        `}</style>
        <div className="rounded-3xl p-7 mb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF8A3D 0%, #FFB347 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-white mb-1" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{displayName}님 반가워요! 👋</h1>
                <p className="text-white/80 text-sm">따뜻한 대화로 마음을 잇는 시간</p>
              </div>
              <Link to="/youth/myinfo">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">정보 수정</span>
                </button>
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="bg-white/20 rounded-2xl px-4 py-2">
                <p className="text-white/80 text-xs">이번달 대화</p>
                <p className="text-white font-bold text-lg">{thisMonthCountText}</p>
              </div>
              <div className="bg-white/20 rounded-2xl px-4 py-2">
                <p className="text-white/80 text-xs">누적 대화 시간</p>
                <p className="text-white font-bold text-lg">{totalMinutesText}</p>
              </div>
              <div className="bg-white/20 rounded-2xl px-4 py-2">
                <p className="text-white/80 text-xs">담당 어르신</p>
                <p className="text-white font-bold text-lg">{activeSeniorCountText}</p>
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" style={{ animation: 'drift1 13s ease-in-out infinite' }} />
          <div className="absolute -right-2 -bottom-12 w-32 h-32 rounded-full bg-white/10" style={{ animation: 'drift2 13s ease-in-out infinite 2s' }} />
          <div className="absolute left-1/2 -bottom-6 w-24 h-24 rounded-full bg-white/10" style={{ animation: 'drift3 13s ease-in-out infinite 4s' }} />
        </div>

        {/* 증명서 배너 (F-30) */}
        <Link to="/youth/conversations">
          <div className="rounded-3xl px-5 py-4 mb-5 flex items-center gap-4 hover:shadow-md transition-all" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 100%)', border: '1.5px solid #FFE8A0' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF4D6' }}>
              <Award className="w-6 h-6" style={{ color: '#E6A817' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900" style={{ fontSize: '0.95rem' }}>사회참여 활동 증명서</p>
              <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>
                발급 완료 {totalCertifiedHoursText} · 발급 가능 {availableCertificateHoursText}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </Link>

        {/* Navigation Cards - 2x2 Grid */}
        <h2 className="text-gray-700 mb-4" style={{ fontSize: '1rem', fontWeight: 600 }}>메뉴</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link to="/youth/profile">
            <div className="rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#FFF4E6' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFE8D6' }}>
                <User className="w-6 h-6" style={{ color: '#FF8A3D' }} />
              </div>
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>나의 프로필</h3>
              <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>자기소개 작성하고 관리해요</p>
              <div className="flex items-center justify-end mt-3">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/youth/matching">
            <div className="rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#E8F8F5' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#D4EDE4' }}>
                <Users className="w-6 h-6" style={{ color: '#3DAF8A' }} />
              </div>
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>매칭 관리</h3>
              <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>어르신과의 연결을 관리해요</p>
              <div className="flex items-center justify-end mt-3">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/youth/schedule">
            <div className="rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#FFF9E6' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF4D6' }}>
                <Calendar className="w-6 h-6" style={{ color: '#E6A817' }} />
              </div>
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>일정 관리</h3>
              <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>대화 시간을 약속하고 관리해요</p>
              <div className="flex items-center justify-end mt-3">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/youth/journal">
            <div className="rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#EBF4FF' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#D6E8FF' }}>
                <MessageCircle className="w-6 h-6" style={{ color: '#3D7AFF' }} />
              </div>
              <h3 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>활동 일지</h3>
              <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>대화 후 소감을 기록해요</p>
              <div className="flex items-center justify-end mt-3">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Link>

          <Link to="/youth/seniors" className="col-span-2">
            <div className="rounded-3xl px-6 py-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-4" style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #D4EDE4' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D4EDE4' }}>
                <Phone className="w-6 h-6" style={{ color: '#3DAF8A' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-0.5" style={{ fontWeight: 600, fontSize: '1rem' }}>어르신 연락하기</h3>
                <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>매칭된 어르신께 전화하고 일정을 잡아요</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        </div>

        {/* Upcoming Schedule */}
        <h2 className="text-gray-700 mb-4" style={{ fontSize: '1rem', fontWeight: 600 }}>다가오는 일정</h2>
        {schedulesLoading && upcomingSchedules.length === 0 ? (
          <div className="bg-white rounded-2xl px-5 py-6 text-center shadow-sm text-gray-400" style={{ fontSize: '0.88rem' }}>
            일정 정보를 불러오는 중...
          </div>
        ) : upcomingSchedules.length > 0 ? (
          <div className="space-y-3">
            {upcomingSchedules.map((schedule) => (
              <div key={schedule.scheduleId} className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFE8D6' }}>
                    <Clock className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                  </div>
                  <div>
                    <p className="text-gray-900" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {schedule.elderName} 어르신
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '0.78rem' }}>
                      {formatScheduleTime(schedule)}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D', fontWeight: 600 }}>
                  {schedule.status === "CONFIRMED" ? "확정" : "대기"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl px-5 py-6 text-center shadow-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400" style={{ fontSize: '0.88rem' }}>예정된 일정이 없어요</p>
            <Link to="/youth/schedule" className="inline-block mt-3 text-sm font-semibold" style={{ color: '#FF8A3D' }}>
              일정 등록하기 →
            </Link>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={logoutConfirm}
        title="로그아웃 하시겠습니까?"
        confirmLabel="로그아웃"
        confirmColor="#FF8A3D"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirm(false)}
      />
    </div>
  );
}
