import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Heart, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export default function YouthMyInfo() {
  const [name, setName] = useState("최윤정");
  const [birthYear, setBirthYear] = useState("1999");
  const [region, setRegion] = useState("서울 마포구");
  const [phone, setPhone] = useState("010-1234-5678");
  const [email, setEmail] = useState("youth@demo.com");

  const handleSave = () => {
    if (!name.trim()) { toast.error("이름을 입력해주세요"); return; }
    toast.success("개인정보가 저장되었습니다!");
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/youth">
              <Button variant="ghost" size="sm" className="rounded-2xl">
                <ArrowLeft className="w-4 h-4 mr-2" />뒤로
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
              <span className="text-xl font-bold text-gray-900">내 정보 수정</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4" style={{ fontSize: '1rem' }}>기본 정보</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">이름</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명 또는 닉네임"
                  className="rounded-2xl"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">출생연도</Label>
                <Input
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="예) 1999"
                  maxLength={4}
                  className="rounded-2xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">거주 지역</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예) 서울 마포구"
                className="rounded-2xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">연락처</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="rounded-2xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">이메일</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900" style={{ fontSize: '0.9rem' }}>비밀번호 변경</p>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.8rem' }}>마지막 변경: 2026년 4월</p>
            </div>
            <button
              className="px-4 py-2 rounded-2xl border text-sm font-semibold"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              onClick={() => toast.info("비밀번호 변경 이메일이 발송되었습니다.")}
            >
              변경하기
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1 rounded-2xl" size="lg" style={{ backgroundColor: '#FF8A3D' }}>
            <Check className="w-4 h-4 mr-2" />
            저장하기
          </Button>
          <Link to="/youth">
            <Button variant="outline" className="rounded-2xl px-6" size="lg">취소</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
