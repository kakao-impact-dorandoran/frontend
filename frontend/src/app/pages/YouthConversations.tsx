import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Award,
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth/AuthContext";
import { ApiError } from "../../lib/api/client";
import {
  getMyCertificates,
  issueCertificate,
} from "../../lib/api/certificate";
import { getMyVolunteerStats } from "../../lib/api/activityRecord";
import type {
  CertificateResponse,
  YouthVolunteerStatsResponse,
} from "../../types/api";
import { ErrorCode } from "../../types/api";

const MINIMUM_ISSUE_HOURS = 10;

function formatIssuedAt(value: string): string {
  const [date = "", rest = ""] = value.split("T");
  const time = rest.slice(0, 5);
  return time ? `${date} ${time}` : date;
}

function resolveStatsError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "프로필이 반려되어 증명서를 이용할 수 없습니다.";
      return err.message || "증명서를 이용할 권한이 없습니다.";
    }
    return err.message || "누적 활동 통계를 불러오지 못했습니다.";
  }
  return "누적 활동 통계를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveListError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "프로필이 반려되어 증명서를 조회할 수 없습니다.";
      return err.message || "증명서를 조회할 권한이 없습니다.";
    }
    return err.message || "증명서 목록을 불러오지 못했습니다.";
  }
  return "증명서 목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.";
}

function resolveIssueError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case ErrorCode.CERTIFICATE_NOT_ENOUGH_ACTIVITY_TIME:
        return "발급 가능한 활동 시간이 부족합니다.";
      case ErrorCode.CERTIFICATE_REQUESTED_HOURS_INVALID:
        return "발급 신청 시간이 유효하지 않습니다.";
      case ErrorCode.CERTIFICATE_SERIAL_DUPLICATED:
        return "증명서 발급 번호가 중복되었습니다. 잠시 후 다시 시도해 주세요.";
      case ErrorCode.INVALID_INPUT:
        return err.message || "입력값을 확인해 주세요.";
      default:
        break;
    }
    if (err.status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
    if (err.status === 403) {
      if (err.code === ErrorCode.ACCOUNT_SUSPENDED) return "이용이 제한된 계정입니다.";
      if (err.code === ErrorCode.YOUTH_PENDING) return "관리자 승인 완료 후 이용할 수 있습니다.";
      if (err.code === ErrorCode.YOUTH_REJECTED) return "프로필이 반려되어 증명서를 발급할 수 없습니다.";
      return err.message || "증명서 발급 권한이 없습니다.";
    }
    if (err.status === 404) return err.message || "청년 정보를 찾을 수 없습니다.";
    return err.message || "증명서 발급에 실패했습니다.";
  }
  return "증명서 발급에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function YouthConversations() {
  const { user } = useAuth();

  const [stats, setStats] = useState<YouthVolunteerStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await getMyVolunteerStats();
      setStats(data);
    } catch (err) {
      setStats(null);
      setStatsError(resolveStatsError(err));
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  const loadCertificates = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    setListError(null);
    try {
      const list = await getMyCertificates();
      setCertificates(list ?? []);
    } catch (err) {
      setCertificates([]);
      setListError(resolveListError(err));
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadStats(); }, [loadStats]);
  useEffect(() => { void loadCertificates(); }, [loadCertificates]);

  const availableHours = stats?.availableCertificateHours ?? 0;
  const totalHours = stats?.totalHours ?? 0;
  const totalCertifiedHours = stats?.totalCertifiedHours ?? 0;
  const totalDurationMinutes = stats?.totalDurationMinutes ?? 0;

  const canIssue = availableHours >= MINIMUM_ISSUE_HOURS;
  const remainingMinutesToThreshold = Math.max(
    0,
    MINIMUM_ISSUE_HOURS * 60 - totalDurationMinutes,
  );
  const progressPercent = Math.min(
    100,
    Math.round((totalDurationMinutes / (MINIMUM_ISSUE_HOURS * 60)) * 100),
  );

  const handleIssue = useCallback(async () => {
    if (!canIssue || submitting) return;
    setSubmitting(true);
    try {
      const created = await issueCertificate({ requestedHours: MINIMUM_ISSUE_HOURS });
      toast.success(`증명서가 발급되었습니다. (${created.certificateSerial})`);
      setIssueDialogOpen(false);
      await Promise.all([loadCertificates(), loadStats()]);
    } catch (err) {
      toast.error(resolveIssueError(err));
    } finally {
      setSubmitting(false);
    }
  }, [canIssue, submitting, loadCertificates, loadStats]);

  const headerSubtext = useMemo(() => {
    if (statsLoading) return "누적 활동 시간을 확인하는 중...";
    if (statsError) return statsError;
    return `누적 ${totalHours}시간 (${totalDurationMinutes}분) · 발급 완료 ${totalCertifiedHours}시간 · 발급 가능 ${availableHours}시간`;
  }, [statsLoading, statsError, totalHours, totalDurationMinutes, totalCertifiedHours, availableHours]);

  return (
    <div className="min-h-screen" style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: "#FAF8F5" }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/youth" className="text-gray-500 hover:text-gray-900" aria-label="대시보드로">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: "#E6A817" }} />
              <h1 className="text-xl font-bold text-gray-900">사회참여 활동 증명서</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void loadCertificates(); void loadStats(); }}
            disabled={listLoading || statsLoading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-gray-500 hover:bg-orange-50 disabled:opacity-50"
            style={{ fontSize: "0.78rem", fontWeight: 600 }}
            aria-label="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(listLoading || statsLoading) ? "animate-spin" : ""}`} />
            새로고침
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* 누적 활동 시간 + 발급 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF9E6" }}>
                <Award className="w-5 h-5" style={{ color: "#E6A817" }} />
              </div>
              <div>
                <p className="font-bold text-gray-900">누적 활동 시간</p>
                <p className="text-xs text-gray-400">사회참여 활동 증명서 기준: {MINIMUM_ISSUE_HOURS}시간</p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl text-white disabled:opacity-60"
              style={{ backgroundColor: canIssue ? "#E6A817" : "#D4D4D4" }}
              disabled={!canIssue || statsLoading || submitting}
              onClick={() => setIssueDialogOpen(true)}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              증명서 발급
            </Button>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                {totalHours}시간 ({totalDurationMinutes}분)
              </span>
              <span>발급 가능 {availableHours}시간</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: canIssue
                    ? "linear-gradient(90deg, #3DAF8A, #52C9A0)"
                    : "linear-gradient(90deg, #FF8A3D, #FFB347)",
                }}
              />
            </div>
          </div>

          {statsError ? (
            <div className="mt-3 rounded-2xl p-3 flex items-center justify-between" style={{ backgroundColor: "#FFF1F1", border: "1px solid #FCA5A5" }}>
              <p className="text-xs" style={{ color: "#B91C1C", fontWeight: 600 }}>{statsError}</p>
              <button
                type="button"
                onClick={() => void loadStats()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-white"
                style={{ backgroundColor: "#FF8A3D", fontSize: "0.72rem", fontWeight: 600 }}
              >
                <RefreshCw className="w-3 h-3" />
                다시 시도
              </button>
            </div>
          ) : canIssue ? (
            <p className="text-xs" style={{ color: "#3DAF8A" }}>
              🎉 발급 가능한 활동 시간이 충분합니다. 증명서를 발급해보세요.
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              {remainingMinutesToThreshold > 0
                ? `${remainingMinutesToThreshold}분 더 활동하면 증명서를 발급받을 수 있어요.`
                : `발급 가능한 시간이 부족합니다. (필요: ${MINIMUM_ISSUE_HOURS}시간)`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">{headerSubtext}</p>
        </div>

        {/* 증명서 목록 */}
        <h2 className="text-gray-700 mb-3" style={{ fontSize: "0.95rem", fontWeight: 600 }}>발급 내역</h2>

        {listLoading ? (
          <div className="bg-white rounded-2xl px-5 py-8 text-center shadow-sm flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span style={{ fontSize: "0.88rem" }}>증명서 목록을 불러오는 중...</span>
          </div>
        ) : listError ? (
          <div className="rounded-2xl p-5 text-center shadow-sm" style={{ backgroundColor: "#FFF1F1", border: "1.5px solid #FCA5A5" }}>
            <p className="text-sm mb-3" style={{ color: "#B91C1C", fontWeight: 600 }}>{listError}</p>
            <button
              type="button"
              onClick={() => void loadCertificates()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white"
              style={{ backgroundColor: "#FF8A3D", fontSize: "0.8rem", fontWeight: 600 }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              다시 시도
            </button>
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white rounded-2xl px-5 py-10 text-center shadow-sm">
            <Award className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 mb-1" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              아직 발급받은 증명서가 없어요
            </p>
            <p className="text-gray-400" style={{ fontSize: "0.8rem" }}>
              누적 활동 시간이 {MINIMUM_ISSUE_HOURS}시간 이상이 되면 증명서를 발급할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((c) => (
              <div key={c.certificateId} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF9E6" }}>
                    <Award className="w-5 h-5" style={{ color: "#E6A817" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <h3 className="text-gray-900 truncate" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {c.title}
                      </h3>
                      <span className="flex items-center gap-0.5 text-xs font-medium flex-shrink-0" style={{ color: "#3DAF8A" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> 발급 완료
                      </span>
                    </div>
                    <p className="font-mono text-xs mb-2" style={{ color: "#E6A817" }}>
                      {c.certificateSerial}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500" style={{ fontSize: "0.82rem" }}>
                      <span>인정 시간 <span className="font-semibold text-gray-700">{c.certifiedHours}시간</span></span>
                      <span>발급일 <span className="font-semibold text-gray-700">{formatIssuedAt(c.issuedAt)}</span></span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      {c.pdfUrl ? (
                        <a
                          href={c.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white"
                          style={{ backgroundColor: "#E6A817", fontSize: "0.8rem", fontWeight: 600 }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          PDF 열기
                        </a>
                      ) : (
                        <p className="text-xs text-gray-400">아직 PDF 파일이 준비되지 않았습니다. 잠시 후 다시 확인해 주세요.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 증명서 발급 확인 다이얼로그 */}
      <Dialog open={issueDialogOpen} onOpenChange={(open) => !submitting && setIssueDialogOpen(open)}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFF9E6" }}>
                <Award className="w-8 h-8" style={{ color: "#E6A817" }} />
              </div>
            </div>
            <DialogTitle className="text-center">사회참여 활동 증명서 발급</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              발급 가능한 활동 시간 <strong>{availableHours}시간</strong> 중 <strong>{MINIMUM_ISSUE_HOURS}시간</strong>으로 증명서를 발급합니다.
              <br />
              발급 후에는 발급 가능 시간이 차감되며, 발급 완료된 증명서는 목록에서 확인할 수 있습니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => setIssueDialogOpen(false)}
                disabled={submitting}
              >
                취소
              </Button>
              <Button
                className="flex-1 rounded-2xl text-white"
                style={{ backgroundColor: "#E6A817" }}
                onClick={() => void handleIssue()}
                disabled={!canIssue || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    발급 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    발급하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
