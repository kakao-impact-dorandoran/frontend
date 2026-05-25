import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Heart, Upload, ArrowLeft, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createYouthProfile,
  getMyYouthProfile,
  updateMyYouthProfile,
} from "../../lib/api/youthProfile";
import { ApiError } from "../../lib/api/client";
import { ErrorCode } from "../../types/api";
import type { YouthProfileResponse } from "../../types/api";
import { useAuth } from "../../lib/auth/AuthContext";

const MAX_KEYWORDS = 5;
const MAX_GREETING_LENGTH = 50;

const availableKeywords = [
  "차분한", "이야기를 잘 듣는", "식물을 좋아하는", "요리를 좋아하는",
  "음악을 좋아하는", "독서를 좋아하는", "유머러스한", "따뜻한",
  "인내심 있는", "공감을 잘하는", "역사에 관심 있는", "영화를 좋아하는"
];

type ApprovalBadge = {
  label: string;
  bg: string;
  color: string;
};

function approvalBadge(
  approvalStatus: YouthProfileResponse["approvalStatus"],
): ApprovalBadge | null {
  switch (approvalStatus) {
    case "PENDING":
      return { label: "승인 대기 중", bg: "#FFF4E6", color: "#FF8A3D" };
    case "APPROVED":
      return { label: "승인 완료", bg: "#E7F6EC", color: "#1F8A4C" };
    case "REJECTED":
      return { label: "반려됨", bg: "#FDECEC", color: "#D14343" };
    default:
      return null;
  }
}

export default function YouthProfile() {
  const { user, refreshMe } = useAuth();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [profile, setProfile] = useState<YouthProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const profileMissingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getMyYouthProfile()
      .then((res) => {
        if (cancelled) return;
        setProfile(res);
        setSelectedKeywords(res.keywords ?? []);
        setBio(res.greetingComment ?? "");
        profileMissingRef.current = false;
      })
      .catch((err) => {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.code === ErrorCode.YOUTH_PROFILE_NOT_FOUND || err.status === 404)
        ) {
          profileMissingRef.current = true;
          setProfile(null);
          setSelectedKeywords([]);
          setBio("");
          return;
        }
        const message =
          err instanceof ApiError
            ? err.message
            : "프로필을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isEditMode = profile !== null;

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else if (selectedKeywords.length < MAX_KEYWORDS) {
      setSelectedKeywords([...selectedKeywords, keyword]);
    } else {
      toast.error(`최대 ${MAX_KEYWORDS}개까지 선택할 수 있습니다`);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    const trimmedBio = bio.trim();
    if (!trimmedBio) {
      toast.error("한 줄 인사말을 입력해주세요.");
      return;
    }
    if (trimmedBio.length > MAX_GREETING_LENGTH) {
      toast.error(`한 줄 인사말은 최대 ${MAX_GREETING_LENGTH}자까지 입력할 수 있습니다.`);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updated = await updateMyYouthProfile({
          keywords: selectedKeywords,
          greetingComment: trimmedBio,
        });
        setProfile(updated);
        setSelectedKeywords(updated.keywords ?? []);
        setBio(updated.greetingComment ?? "");
        toast.success("자기소개가 저장되었습니다!");
      } else {
        await createYouthProfile({
          keywords: selectedKeywords,
          greetingComment: trimmedBio,
        });
        toast.success("프로필이 등록되었습니다. 관리자 승인을 기다려주세요.");
        const refreshed = await getMyYouthProfile().catch(() => null);
        if (refreshed) {
          setProfile(refreshed);
          setSelectedKeywords(refreshed.keywords ?? []);
          setBio(refreshed.greetingComment ?? "");
          profileMissingRef.current = false;
        }
      }
      await refreshMe();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message || "저장에 실패했습니다.");
      } else {
        toast.error("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const badge = useMemo(() => {
    const status = profile?.approvalStatus ?? user?.approvalStatus ?? null;
    return approvalBadge(status);
  }, [profile, user]);

  const rejectionReason = profile?.rejectionReason ?? user?.rejectionReason ?? null;
  const showRejection = (profile?.approvalStatus ?? user?.approvalStatus) === "REJECTED" && rejectionReason;
  const displayName = user?.name ?? "청년 회원";

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      {/* Header */}
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
              <span className="text-xl font-bold text-gray-900">
                {isEditMode ? "자기소개 수정" : "프로필 등록"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {isLoading ? (
          <div className="bg-white rounded-3xl shadow-sm p-10 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FF8A3D' }} />
            <p className="text-sm">프로필을 불러오는 중입니다...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <p className="text-gray-700 mb-4">{loadError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="rounded-2xl"
              style={{ backgroundColor: '#FF8A3D' }}
            >
              다시 시도
            </Button>
          </div>
        ) : (
          <>
            {/* 승인 상태 배지 */}
            {badge && (
              <div className="bg-white rounded-3xl shadow-sm p-5 mb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-gray-400 mb-1" style={{ fontSize: '0.75rem' }}>승인 상태</p>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: badge.bg, color: badge.color, fontWeight: 600 }}
                  >
                    {badge.label}
                  </span>
                </div>
                {showRejection && (
                  <div className="w-full rounded-2xl p-3 mt-2" style={{ backgroundColor: '#FDECEC' }}>
                    <p className="text-xs text-gray-500 mb-1">반려 사유</p>
                    <p className="text-sm text-gray-700">{rejectionReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* 프로필 사진 */}
            <div className="bg-white rounded-3xl shadow-sm p-6 mb-4 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
                🧑
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-0.5">{displayName}</p>
                <p className="text-gray-400 mb-2" style={{ fontSize: '0.82rem' }}>{user?.email ?? ""}</p>
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm opacity-60 cursor-not-allowed"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  title="사진 변경은 추후 지원 예정입니다"
                >
                  <Upload className="w-3.5 h-3.5" /> 사진 변경
                </button>
              </div>
            </div>

            {/* 한 줄 소개 */}
            <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
              <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '1rem' }}>한 줄 소개</h2>
              <p className="text-gray-400 mb-3" style={{ fontSize: '0.82rem' }}>어르신과 매칭될 때 보여지는 소개글이에요</p>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_GREETING_LENGTH))}
                placeholder="예: 안녕하세요! 따뜻한 대화를 나누고 싶은 청년입니다 :)"
                rows={3}
                className="rounded-2xl resize-none"
                disabled={isSaving}
              />
              <p className="text-right text-gray-400 mt-1" style={{ fontSize: '0.75rem' }}>
                {bio.length} / {MAX_GREETING_LENGTH}자
              </p>
            </div>

            {/* 나의 키워드 */}
            <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
              <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '1rem' }}>
                나의 키워드 <span className="text-sm font-normal text-gray-400">(최대 {MAX_KEYWORDS}개)</span>
              </h2>
              <p className="text-gray-400 mb-4" style={{ fontSize: '0.82rem' }}>나를 잘 표현하는 키워드를 골라주세요</p>

              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white disabled:opacity-60"
                      style={{ backgroundColor: '#FF8A3D', fontWeight: 600 }}
                    >
                      #{keyword}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {availableKeywords.filter((k) => !selectedKeywords.includes(k)).map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => toggleKeyword(keyword)}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-full text-sm border transition-colors hover:border-orange-300 disabled:opacity-60"
                    style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  >
                    #{keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                className="flex-1 rounded-2xl"
                size="lg"
                style={{ backgroundColor: '#FF8A3D' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {isEditMode ? "저장하기" : "프로필 등록"}
                  </>
                )}
              </Button>
              <Link to="/youth">
                <Button variant="outline" className="rounded-2xl px-6" size="lg" disabled={isSaving}>
                  취소
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
