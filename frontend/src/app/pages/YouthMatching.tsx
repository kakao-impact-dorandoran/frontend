import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import {
  Heart,
  ArrowLeft,
  Users,
  CheckCircle,
  User,
  Loader2,
  RefreshCw,
  Phone,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../lib/api/client";
import { getMatchingElders } from "../../lib/api/matching";
import type {
  CallType,
  DifficultyLevel,
  MatchingElderListParams,
  MatchingElderListResponse,
} from "../../types/api";

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  LOW: "쉬움",
  MEDIUM: "보통",
  HIGH: "활발",
};

const DIFFICULTY_COLOR: Record<DifficultyLevel, { color: string; backgroundColor: string }> = {
  LOW: { color: "#3DAF8A", backgroundColor: "#E8F8F5" },
  MEDIUM: { color: "#3D7AFF", backgroundColor: "#EBF4FF" },
  HIGH: { color: "#FF8A3D", backgroundColor: "#FFF4E6" },
};

const CALL_TYPE_LABEL: Record<CallType, string> = {
  VIDEO: "화상 통화",
  AUDIO: "음성 통화",
};

const DIFFICULTY_OPTIONS: Array<{ value: "" | DifficultyLevel; label: string }> = [
  { value: "", label: "전체" },
  { value: "LOW", label: "쉬움" },
  { value: "MEDIUM", label: "보통" },
  { value: "HIGH", label: "활발" },
];

const CALL_TYPE_OPTIONS: Array<{ value: "" | CallType; label: string }> = [
  { value: "", label: "전체" },
  { value: "VIDEO", label: "화상" },
  { value: "AUDIO", label: "음성" },
];

type FilterState = {
  interest: string;
  preferredCallType: "" | CallType;
  difficultyLevel: "" | DifficultyLevel;
};

const INITIAL_FILTERS: FilterState = {
  interest: "",
  preferredCallType: "",
  difficultyLevel: "",
};

function buildParams(filters: FilterState): MatchingElderListParams | undefined {
  const params: MatchingElderListParams = {};
  const interest = filters.interest.trim();
  if (interest) params.interest = interest;
  if (filters.preferredCallType) params.preferredCallType = filters.preferredCallType;
  if (filters.difficultyLevel) params.difficultyLevel = filters.difficultyLevel;
  return Object.keys(params).length > 0 ? params : undefined;
}

function resolveErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    if (err.status === 403) {
      return err.message || "매칭 기능 이용 권한이 없습니다. 관리자 승인 여부를 확인해주세요.";
    }
    return err.message || "어르신 목록을 불러오지 못했습니다.";
  }
  return "어르신 목록을 불러오지 못했습니다. 네트워크 상태를 확인해주세요.";
}

export default function YouthMatching() {
  const [elders, setElders] = useState<MatchingElderListResponse[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchElders = useCallback(async (next: FilterState, mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await getMatchingElders(buildParams(next));
      setElders(data ?? []);
      setHasLoadedOnce(true);
    } catch (err) {
      setError(resolveErrorMessage(err));
      setElders([]);
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchElders(INITIAL_FILTERS, "initial");
  }, [fetchElders]);

  const applyFilters = () => {
    setFilters(draftFilters);
    void fetchElders(draftFilters, "refresh");
  };

  const resetFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
    void fetchElders(INITIAL_FILTERS, "refresh");
  };

  const handleRetry = () => {
    void fetchElders(filters, hasLoadedOnce ? "refresh" : "initial");
  };

  const handleSelectElder = (elder: MatchingElderListResponse) => {
    toast.info(`${elder.name} 어르신 상세/매칭 신청은 다음 단계에서 연결 예정입니다.`);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/youth">
            <Button variant="ghost" size="sm" className="rounded-2xl">
              <ArrowLeft className="w-4 h-4 mr-2" />뒤로
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6" style={{ color: "#FF8A3D" }} />
            <span className="text-xl font-bold text-gray-900">어르신 매칭</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">매칭 가능한 어르신</h2>
          <p className="text-sm text-gray-500">조건에 맞는 어르신을 찾아보세요</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
          <input
            type="text"
            value={draftFilters.interest}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, interest: e.target.value }))}
            placeholder="관심사 키워드 (예: 산책, 음악)"
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300"
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          <select
            value={draftFilters.preferredCallType}
            onChange={(e) =>
              setDraftFilters((prev) => ({ ...prev, preferredCallType: e.target.value as "" | CallType }))
            }
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-orange-300"
          >
            {CALL_TYPE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                통화: {opt.label}
              </option>
            ))}
          </select>
          <select
            value={draftFilters.difficultyLevel}
            onChange={(e) =>
              setDraftFilters((prev) => ({ ...prev, difficultyLevel: e.target.value as "" | DifficultyLevel }))
            }
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-orange-300"
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                난이도: {opt.label}
              </option>
            ))}
          </select>
          <Button
            onClick={applyFilters}
            className="rounded-xl text-white"
            style={{ backgroundColor: "#FF8A3D" }}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
          </Button>
          <Button onClick={resetFilters} variant="outline" className="rounded-xl" disabled={isRefreshing}>
            초기화
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: "#FF8A3D" }} />
            <p>어르신 목록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEE2E2" }}>
              <Users className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">목록을 불러오지 못했습니다</p>
            <p className="text-gray-500 mb-5" style={{ fontSize: "0.9rem" }}>{error}</p>
            <Button
              onClick={handleRetry}
              className="rounded-2xl text-white"
              style={{ backgroundColor: "#FF8A3D" }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        ) : elders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-700 font-semibold mb-1">추천 가능한 어르신이 없습니다</p>
            <p className="text-gray-400" style={{ fontSize: "0.85rem" }}>
              조건을 바꾸거나 잠시 후 다시 시도해주세요.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {elders.map((elder) => {
              const difficultyStyle = DIFFICULTY_COLOR[elder.difficultyLevel];
              const matched = elder.status === "MATCHED";
              return (
                <div
                  key={elder.elderId}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                  style={{ opacity: matched ? 0.85 : 1 }}
                >
                  <div className="w-full h-36 relative flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
                    {elder.profileImageUrl ? (
                      <img
                        src={elder.profileImageUrl}
                        alt={`${elder.name} 어르신 프로필`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E5E7EB" }}>
                        <User className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    {matched && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(61,175,138,0.7)" }}>
                        <div className="text-center text-white">
                          <CheckCircle className="w-8 h-8 mx-auto mb-1" />
                          <p className="text-sm font-bold">매칭 완료</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                        {elder.name} 어르신
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={difficultyStyle}
                      >
                        {DIFFICULTY_LABEL[elder.difficultyLevel]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-gray-400" style={{ fontSize: "0.82rem" }}>
                      <span>{elder.ageGroup}</span>
                      <span>·</span>
                      <span>{elder.gender === "FEMALE" ? "여성" : "남성"}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                      {elder.preferredCallType === "VIDEO" ? (
                        <Video className="w-3 h-3" />
                      ) : (
                        <Phone className="w-3 h-3" />
                      )}
                      {CALL_TYPE_LABEL[elder.preferredCallType]} 선호
                    </div>
                    {elder.interests && elder.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {elder.interests.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: "#FFF4E6", color: "#FF8A3D", fontWeight: 600 }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-500 mb-4" style={{ fontSize: "0.83rem", lineHeight: 1.6 }}>
                      {elder.greetingComment}
                    </p>
                    <button
                      disabled={matched}
                      className="w-full py-2.5 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: matched ? "#3DAF8A" : "#FF8A3D",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                      onClick={() => !matched && handleSelectElder(elder)}
                    >
                      {matched ? "매칭됨" : "매칭 신청하기"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
