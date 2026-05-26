import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Heart, Clock, Ban, XCircle, User, Shield, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth/AuthContext";
import { routeForRole } from "../../lib/auth/routes";
import { ApiError } from "../../lib/api/client";
import { ErrorCode } from "../../types/api";

type DemoAccount = {
  key: "youth" | "guardian" | "admin";
  roleLabel: string;
  description: string;
  id: string;
  password: string;
  Icon: typeof User;
};

const SHOW_DEMO_ACCOUNTS =
  import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

const DEMO_ACCOUNT_LIST: DemoAccount[] = [
  {
    key: "youth",
    roleLabel: "청년",
    description: "승인 완료된 청년 계정. 매칭/일정/통화 데모용.",
    id: import.meta.env.VITE_DEMO_YOUTH_ID || "youth_approved",
    password: import.meta.env.VITE_DEMO_YOUTH_PASSWORD || "",
    Icon: User,
  },
  {
    key: "guardian",
    roleLabel: "보호자",
    description: "보호자 대시보드 / 어르신 관리 데모용.",
    id: import.meta.env.VITE_DEMO_GUARDIAN_ID || "guardian",
    password: import.meta.env.VITE_DEMO_GUARDIAN_PASSWORD || "",
    Icon: Shield,
  },
  {
    key: "admin",
    roleLabel: "관리자",
    description: "관리자 운영 큐 / 승인·제재 데모용.",
    id: import.meta.env.VITE_DEMO_ADMIN_ID || "admin",
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "",
    Icon: UserCog,
  },
];

function getSafeRedirectPath(from: unknown): string | null {
  if (
    typeof from === "object" &&
    from !== null &&
    "pathname" in from &&
    typeof (from as { pathname?: unknown }).pathname === "string"
  ) {
    const pathname = (from as { pathname: string }).pathname;
    if (pathname.startsWith("/") && !pathname.startsWith("//") && pathname !== "/login") {
      return pathname;
    }
  }
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDialog, setPendingDialog] = useState(false);
  const [suspendedDialog, setSuspendedDialog] = useState(false);
  const [rejectedDialog, setRejectedDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const redirectPath = getSafeRedirectPath(
    (location.state as { from?: unknown } | null)?.from,
  );

  if (status === "authenticated" && user) {
    return <Navigate to={redirectPath ?? routeForRole(user.role, user)} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const me = await login(email, password);
      navigate(redirectPath ?? routeForRole(me.role, me), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === ErrorCode.YOUTH_PENDING) {
          setPendingDialog(true);
          return;
        }
        if (err.code === ErrorCode.YOUTH_REJECTED) {
          setRejectionReason(err.message ?? null);
          setRejectedDialog(true);
          return;
        }
        if (err.code === ErrorCode.ACCOUNT_SUSPENDED) {
          setSuspendedDialog(true);
          return;
        }
        toast.error(err.message || "로그인에 실패했습니다.");
      } else {
        toast.error("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLogin = (_provider: string) => {
    toast.info("소셜 로그인은 아직 준비 중입니다.");
  };

  const handleFillDemoAccount = (account: DemoAccount) => {
    setEmail(account.id);
    if (account.password) {
      setPassword(account.password);
      toast.success(`${account.roleLabel} 시연 계정을 입력했습니다.`);
    } else {
      setPassword("");
      toast.info(
        `${account.roleLabel} ID만 채웠습니다. 비밀번호는 직접 입력해주세요. (환경변수 미설정)`,
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-8 h-8" style={{ color: '#FF8A3D' }} />
          <span className="text-2xl font-bold text-gray-900">도란도란</span>
        </Link>

        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>계정에 로그인하여 시작하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-2xl"
                />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: '#FF8A3D' }}>
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Button type="submit" className="w-full rounded-2xl" style={{ backgroundColor: '#FF8A3D' }} disabled={submitting}>
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialLogin("kakao")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.8-.7 2.8-.8 3.2 0 0 0 .3.2.4.1.1.3.1.5 0 .5-.1 3.5-2.3 4.1-2.7.4 0 .8.1 1.2.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialLogin("naver")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버로 시작하기
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialLogin("google")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 시작하기
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">아직 계정이 없으신가요? </span>
              <Link to="/signup" className="hover:underline font-semibold" style={{ color: '#FF8A3D' }}>
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>

        {SHOW_DEMO_ACCOUNTS && (
          <Card className="mt-4 rounded-3xl border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">시연용 계정</CardTitle>
              <CardDescription className="text-xs">
                아래 카드의 “입력하기”를 누르면 로그인 폼에 값이 채워집니다.
                실제 로그인은 위 로그인 버튼을 눌러 진행하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEMO_ACCOUNT_LIST.map((account) => {
                const { Icon } = account;
                const hasPassword = Boolean(account.password);
                return (
                  <div
                    key={account.key}
                    className="flex items-start gap-3 rounded-2xl p-3"
                    style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFE8D6" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#FFE8D6" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#FF8A3D" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {account.roleLabel}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {account.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {account.description}
                      </p>
                      {!hasPassword && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          비밀번호 환경변수 미설정 — 수동 입력 필요
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl shrink-0"
                      onClick={() => handleFillDemoAccount(account)}
                    >
                      입력하기
                    </Button>
                  </div>
                );
              })}
              <p className="text-[11px] text-gray-400 pt-1">
                실제 비밀번호는 <code>.env.development.local</code> 에만 보관하세요.
                코드/저장소에는 커밋하지 않습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 승인 대기 팝업 (F-03) */}
      <Dialog open={pendingDialog} onOpenChange={setPendingDialog}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF4E6' }}>
                <Clock className="w-8 h-8" style={{ color: '#FF8A3D' }} />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">관리자 승인 대기 중</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 pb-2">
            <p className="text-gray-600 text-sm leading-relaxed">
              현재 관리자가 회원님의 프로필을 검토하고 있습니다.<br />
              승인이 완료되면 이메일로 안내드릴게요.
            </p>
            <p className="text-xs text-gray-400">보통 1~3 영업일 내에 처리됩니다.</p>
            <Button className="w-full rounded-2xl mt-2" style={{ backgroundColor: '#FF8A3D' }} onClick={() => setPendingDialog(false)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 반려 안내 팝업 (F-03 REJECTED) */}
      <Dialog open={rejectedDialog} onOpenChange={setRejectedDialog}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-50">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">프로필 반려 안내</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 pb-2">
            <div className="rounded-2xl p-3 text-left" style={{ backgroundColor: '#FFF4E6', border: '1px solid #FFE8D6' }}>
              <p className="text-xs text-gray-500 mb-1">반려 사유</p>
              <p className="text-sm text-gray-700">
                {rejectionReason ?? "프로필 사진 또는 자기소개 내용이 서비스 운영 기준에 맞지 않습니다. 내용을 수정한 후 다시 제출해주세요."}
              </p>
            </div>
            <p className="text-xs text-gray-400">프로필을 수정하면 재검토를 요청할 수 있습니다.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setRejectedDialog(false)}>닫기</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: '#FF8A3D' }} onClick={() => { setRejectedDialog(false); navigate("/youth/profile"); }}>
                프로필 수정하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 제재 안내 팝업 (F-03) */}
      <Dialog open={suspendedDialog} onOpenChange={setSuspendedDialog}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-50">
                <Ban className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">이용 제한 안내</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3 pb-2">
            <p className="text-gray-600 text-sm leading-relaxed">
              운영 정책 위반으로 이용이 제한되었습니다.<br />
              문의가 필요하시면 고객센터에 연락해주세요.
            </p>
            <p className="text-xs text-gray-400">고객센터: contact@dorandoran.kr</p>
            <Button className="w-full rounded-2xl mt-2" variant="outline" onClick={() => setSuspendedDialog(false)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
