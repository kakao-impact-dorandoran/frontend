import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ApiError } from "../../lib/api/client";
import {
  createMatch,
  getMatchingElderDetail,
  getMatchingElders,
  getMyMatchLimit,
} from "../../lib/api/matching";
import type {
  CallType,
  DifficultyLevel,
  MatchingElderDetailResponse,
  MatchingElderListParams,
  MatchingElderListResponse,
  YouthMatchLimitResponse,
} from "../../types/api";
import { ErrorCode } from "../../types/api";

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

const ICEBREAKING_MAX_LENGTH = 500;

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

function resolveCreateMatchError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.ICEBREAKING_MESSAGE_REQUIRED:
        return "사전 인사말을 입력해 주세요.";
      case ErrorCode.DUPLICATE_MATCH:
        return "이미 매칭된 어르신입니다.";
      case ErrorCode.MATCH_LIMIT_EXCEEDED:
        return "담당 가능한 어르신 수를 초과했습니다.";
      case ErrorCode.ELDER_NOT_AVAILABLE:
        return "현재 매칭할 수 없는 어르신입니다.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    if (err.status === 403) {
      return err.message || "관리자 승인 완료 후 매칭을 신청할 수 있습니다.";
    }
    if (err.status === 400) {
      return err.message || "입력값을 확인해 주세요.";
    }
    return err.message || "매칭 신청 중 오류가 발생했습니다.";
  }
  return "매칭 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

function resolveLimitErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "담당 인원 정보를 조회할 권한이 없습니다.";
    return err.message || "담당 인원 정보를 불러오지 못했습니다.";
  }
  return "담당 인원 정보를 불러오지 못했습니다.";
}

export default function YouthMatching() {
  const [elders, setElders] = useState<MatchingElderListResponse[]>([]);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [matchLimit, setMatchLimit] = useState<YouthMatchLimitResponse | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isLimitLoading, setIsLimitLoading] = useState(false);

  const [activeElder, setActiveElder] = useState<MatchingElderListResponse | null>(null);
  const [activeElderDetail, setActiveElderDetail] = useState<MatchingElderDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [icebreakingMessage, setIcebreakingMessage] = useState("");
  const [icebreakingError, setIcebreakingError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [matchedElderIds, setMatchedElderIds] = useState<Set<string>>(new Set());

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

  const fetchLimit = useCallback(async () => {
    setIsLimitLoading(true);
    setLimitError(null);
    try {
      const limit = await getMyMatchLimit();
      setMatchLimit(limit);
    } catch (err) {
      setMatchLimit(null);
      setLimitError(resolveLimitErrorMessage(err));
    } finally {
      setIsLimitLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchElders(INITIAL_FILTERS, "initial");
    void fetchLimit();
  }, [fetchElders, fetchLimit]);

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

  const canMatch = matchLimit?.canMatch ?? true;
  const limitBlocked = matchLimit ? !matchLimit.canMatch : false;

  const isElderMatched = useCallback(
    (elder: MatchingElderListResponse) =>
      elder.status === "MATCHED" || matchedElderIds.has(elder.elderId),
    [matchedElderIds],
  );

  const handleSelectElder = useCallback(
    async (elder: MatchingElderListResponse) => {
      if (isElderMatched(elder) || elder.status === "INACTIVE") return;
      if (limitBlocked) {
        toast.error("담당 가능한 어르신 수를 초과했습니다.");
        return;
      }
      setActiveElder(elder);
      setActiveElderDetail(null);
      setDetailError(null);
      setIcebreakingMessage("");
      setIcebreakingError(null);
      setIsDetailLoading(true);
      try {
        const detail = await getMatchingElderDetail(elder.elderId);
        setActiveElderDetail(detail);
      } catch (err) {
        setDetailError(
          err instanceof ApiError
            ? err.message || "어르신 상세 정보를 불러오지 못했습니다."
            : "어르신 상세 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsDetailLoading(false);
      }
    },
    [isElderMatched, limitBlocked],
  );

  const closeDialog = () => {
    if (isCreating) return;
    setActiveElder(null);
    setActiveElderDetail(null);
    setDetailError(null);
    setIcebreakingMessage("");
    setIcebreakingError(null);
  };

  const handleCreateMatch = async () => {
    if (!activeElder) return;
    const trimmed = icebreakingMessage.trim();
    if (!trimmed) {
      setIcebreakingError("사전 인사말을 입력해 주세요.");
      return;
    }
    if (trimmed.length > ICEBREAKING_MAX_LENGTH) {
      setIcebreakingError(`사전 인사말은 최대 ${ICEBREAKING_MAX_LENGTH}자까지 입력 가능합니다.`);
      return;
    }
    setIcebreakingError(null);
    setIsCreating(true);
    try {
      await createMatch({
        elderId: activeElder.elderId,
        icebreakingMessage: trimmed,
      });
      toast.success(`${activeElder.name} 어르신과 매칭이 완료되었습니다.`);
      setMatchedElderIds((prev) => {
        const next = new Set(prev);
        next.add(activeElder.elderId);
        return next;
      });
      setActiveElder(null);
      setActiveElderDetail(null);
      setIcebreakingMessage("");
      void fetchElders(filters, "refresh");
      void fetchLimit();
    } catch (err) {
      const message = resolveCreateMatchError(err);
      setIcebreakingError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const displayedElder = useMemo<MatchingElderDetailResponse | null>(() => {
    if (activeElderDetail) return activeElderDetail;
    if (!activeElder) return null;
    return {
      elderId: activeElder.elderId,
      name: activeElder.name,
      ageGroup: activeElder.ageGroup,
      gender: activeElder.gender,
      profileImageUrl: activeElder.profileImageUrl,
      greetingComment: activeElder.greetingComment,
      interests: activeElder.interests,
      preferredCallType: activeElder.preferredCallType,
      difficultyLevel: activeElder.difficultyLevel,
      requestNotes: null,
      status: activeElder.status,
    };
  }, [activeElder, activeElderDetail]);

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

        <div
          className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#FFF4E6" }}
            >
              <Users className="w-5 h-5" style={{ color: "#FF8A3D" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">담당 어르신 현황</p>
              {isLimitLoading ? (
                <p className="text-xs text-gray-400">불러오는 중...</p>
              ) : limitError ? (
                <p className="text-xs text-red-500">{limitError}</p>
              ) : matchLimit ? (
                <p className="text-xs text-gray-500">
                  현재 <span className="font-semibold text-gray-700">{matchLimit.currentMatchCount}</span> / {matchLimit.maxMatchCount}명
                  · 남은 인원 <span className="font-semibold text-gray-700">{matchLimit.remainingMatchCount}</span>명
                </p>
              ) : (
                <p className="text-xs text-gray-400">담당 인원 정보 없음</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {matchLimit && !matchLimit.canMatch && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: "#FEE2E2", color: "#DC2626", fontWeight: 600 }}
              >
                담당 인원 가득 참
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchLimit()}
              disabled={isLimitLoading}
              className="rounded-xl"
            >
              {isLimitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "새로고침"}
            </Button>
          </div>
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
              const matched = isElderMatched(elder);
              const inactive = elder.status === "INACTIVE";
              const disabled = matched || inactive || (limitBlocked && !matched);
              const isOpening = activeElder?.elderId === elder.elderId && isDetailLoading;
              return (
                <div
                  key={elder.elderId}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                  style={{ opacity: matched || inactive ? 0.85 : 1 }}
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
                      disabled={disabled || isOpening}
                      className="w-full py-2.5 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: matched ? "#3DAF8A" : inactive ? "#9CA3AF" : "#FF8A3D",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                      onClick={() => {
                        if (disabled) return;
                        void handleSelectElder(elder);
                      }}
                    >
                      {isOpening && <Loader2 className="w-4 h-4 animate-spin" />}
                      {matched
                        ? "매칭됨"
                        : inactive
                          ? "매칭 불가"
                          : limitBlocked
                            ? "담당 인원 초과"
                            : isOpening
                              ? "불러오는 중..."
                              : "매칭 신청하기"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!activeElder}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {displayedElder ? `${displayedElder.name} 어르신에게 인사 보내기` : "어르신 상세"}
            </DialogTitle>
            <DialogDescription>
              사전 인사말을 작성하면 매칭이 즉시 생성됩니다.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading && !activeElderDetail ? (
            <div className="py-8 flex flex-col items-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: "#FF8A3D" }} />
              <span className="text-sm">상세 정보를 불러오는 중...</span>
            </div>
          ) : displayedElder ? (
            <div className="space-y-4">
              {detailError && (
                <div
                  className="rounded-2xl p-3 text-xs"
                  style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                >
                  {detailError} 일부 정보가 부족할 수 있습니다.
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                  {displayedElder.profileImageUrl ? (
                    <img
                      src={displayedElder.profileImageUrl}
                      alt={`${displayedElder.name} 어르신 프로필`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">{displayedElder.name} 어르신</p>
                  <p className="text-xs text-gray-500">
                    {displayedElder.ageGroup} · {displayedElder.gender === "FEMALE" ? "여성" : "남성"} · {CALL_TYPE_LABEL[displayedElder.preferredCallType]} 선호
                  </p>
                </div>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={DIFFICULTY_COLOR[displayedElder.difficultyLevel]}
                >
                  {DIFFICULTY_LABEL[displayedElder.difficultyLevel]}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">한 줄 소개</p>
                <p className="text-sm text-gray-700 leading-relaxed">{displayedElder.greetingComment}</p>
              </div>

              {displayedElder.interests && displayedElder.interests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">관심사</p>
                  <div className="flex flex-wrap gap-1.5">
                    {displayedElder.interests.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "#FFF4E6", color: "#FF8A3D", fontWeight: 600 }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {displayedElder.requestNotes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">보호자 요청 사항</p>
                  <p
                    className="text-sm text-gray-700 leading-relaxed rounded-2xl p-3"
                    style={{ backgroundColor: "#FAF8F5" }}
                  >
                    {displayedElder.requestNotes}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  사전 인사말 <span style={{ color: "#FF8A3D" }}>*</span>
                </label>
                <textarea
                  value={icebreakingMessage}
                  onChange={(e) => {
                    setIcebreakingMessage(e.target.value);
                    if (icebreakingError) setIcebreakingError(null);
                  }}
                  maxLength={ICEBREAKING_MAX_LENGTH}
                  rows={4}
                  placeholder="안녕하세요, 앞으로 즐겁게 대화 나누고 싶습니다."
                  disabled={isCreating}
                  className="w-full px-3 py-2 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 disabled:opacity-60 resize-none"
                />
                <div className="flex justify-between mt-1 text-xs">
                  <span className={icebreakingError ? "text-red-500" : "text-gray-400"}>
                    {icebreakingError ?? "어르신께 전할 첫 인사를 남겨 주세요."}
                  </span>
                  <span className="text-gray-400">
                    {icebreakingMessage.length}/{ICEBREAKING_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {limitBlocked && (
                <div
                  className="rounded-2xl p-3 text-xs"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                >
                  담당 가능한 어르신 수를 초과했습니다. 기존 매칭 정리 후 다시 시도해 주세요.
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isCreating}
              className="rounded-2xl"
            >
              취소
            </Button>
            <Button
              onClick={() => void handleCreateMatch()}
              disabled={
                isCreating ||
                isDetailLoading ||
                limitBlocked ||
                !canMatch ||
                !icebreakingMessage.trim()
              }
              className="rounded-2xl text-white"
              style={{ backgroundColor: "#FF8A3D" }}
            >
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  신청 중...
                </span>
              ) : (
                "매칭 신청하기"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
