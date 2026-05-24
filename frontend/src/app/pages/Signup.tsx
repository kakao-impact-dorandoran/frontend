import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"youth" | "guardian" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const goNext = (type: "youth" | "guardian") => {
    if (type === "youth") navigate("/youth/profile");
    else navigate("/guardian/senior-profile");
  };

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (!phone.trim()) {
      toast.error("휴대폰 번호를 입력해주세요.");
      return;
    }
    if (selectedType === "youth") {
      toast.success(`${name}님, 가입이 완료되었습니다! 프로필을 등록해주세요.`);
    } else {
      toast.success(`${name}님, 가입이 완료되었습니다! 어르신 프로필을 등록해주세요.`);
    }
    goNext(selectedType!);
  };

  const handleSocialSignup = (provider: string) => {
    console.log(`Signup with ${provider} as ${selectedType}`);
    goNext(selectedType!);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <div className="w-full max-w-4xl">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-8 h-8" style={{ color: '#FF8A3D' }} />
          <span className="text-2xl font-bold text-gray-900">도란도란</span>
        </Link>

        {!selectedType ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
              <p className="text-gray-600">어떤 방식으로 참여하시나요?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* 청년 */}
              <div
                className="bg-white rounded-3xl p-8 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-300"
                onClick={() => setSelectedType("youth")}
              >
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF4E6' }}>
                    <div className="text-5xl">🧑</div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">청년으로 시작하기</h2>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    어르신과 정기 화상·음성 대화
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    사회참여 활동 증명서 발급
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    관리자 승인 후 활동 시작
                  </li>
                </ul>
              </div>

              {/* 보호자/기관 */}
              <div
                className="bg-white rounded-3xl p-8 cursor-pointer shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-teal-300"
                onClick={() => setSelectedType("guardian")}
              >
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#E8F8F5' }}>
                    <div className="text-5xl">👨‍👩‍👴</div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 whitespace-nowrap">보호자/기관으로 시작하기</h2>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#3DAF8A' }} />
                    어르신 프로필 등록
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#3DAF8A' }} />
                    전용 태블릿 무상 제공
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#3DAF8A' }} />
                    대화 진행 여부 확인
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">이미 계정이 있으신가요? </span>
              <Link to="/login" className="hover:underline font-semibold" style={{ color: '#FF8A3D' }}>
                로그인
              </Link>
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto rounded-3xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">
                {selectedType === "youth" ? "청년 회원가입" : "보호자/기관 회원가입"}
              </CardTitle>
              <CardDescription>
                {selectedType === "youth"
                  ? "가입 후 관리자 승인을 거쳐 활동이 시작됩니다."
                  : "가입 후 어르신 프로필을 등록해주세요."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleEmailSignup} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required className="rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required className="rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    휴대폰 번호 <span className="text-red-400 text-xs">*필수</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    required
                    className="rounded-2xl"
                  />
                  <p className="text-xs text-gray-400">휴대폰 번호로 본인 확인을 갈음합니다.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" required className="rounded-2xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                  <Input id="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" required className="rounded-2xl" />
                </div>
                <Button type="submit" className="w-full rounded-2xl" style={{ backgroundColor: '#FF8A3D' }}>이메일로 가입하기</Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">또는 SNS로 가입</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialSignup("kakao")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.8-.7 2.8-.8 3.2 0 0 0 .3.2.4.1.1.3.1.5 0 .5-.1 3.5-2.3 4.1-2.7.4 0 .8.1 1.2.1 5.5 0 10-3.6 10-8S17.5 3 12 3z"/>
                </svg>
                카카오로 시작하기
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialSignup("naver")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버로 시작하기
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-2xl" onClick={() => handleSocialSignup("google")}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 시작하기
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => setSelectedType(null)}>
                ← 뒤로 가기
              </Button>

              {selectedType === "youth" && (
                <div className="mt-2 p-4 rounded-2xl" style={{ backgroundColor: '#FFF4E6' }}>
                  <p className="text-sm text-gray-700">
                    <strong>청년 분께:</strong> 가입 후 관리자 검수 및 승인을 거쳐야 활동을 시작할 수 있습니다. 프로필을 성실히 작성해주세요.
                  </p>
                </div>
              )}
              {selectedType === "guardian" && (
                <div className="mt-2 p-4 rounded-2xl" style={{ backgroundColor: '#E8F8F5' }}>
                  <p className="text-sm text-gray-700">
                    <strong>보호자 분께:</strong> 가입 후 어르신 프로필을 등록하면 전용 태블릿이 무상으로 제공됩니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
