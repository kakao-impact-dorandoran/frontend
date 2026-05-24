import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Heart, Upload, CheckCircle, User } from "lucide-react";
import { toast } from "sonner";

const availableKeywords = [
  "조용히 듣는 걸 좋아해요", "이야기가 많아요", "음악을 좋아해요",
  "요리 이야기를 좋아해요", "옛날 이야기를 즐겨요", "가족 이야기를 좋아해요",
  "건강 이야기에 관심 있어요", "종교가 있어요", "텃밭을 가꿔요",
  "독서를 좋아해요", "산책을 즐겨요", "손재주가 좋아요"
];

const timeSlots = [
  "오전 9시~11시", "오전 11시~오후 1시",
  "오후 1시~3시", "오후 3시~5시",
  "오후 5시~7시", "저녁 7시~9시"
];

const dayOptions = ["월", "화", "수", "목", "금", "토", "일"];

export default function SeniorProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [greeting, setGreeting] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [guardianNote, setGuardianNote] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [completed, setCompleted] = useState(false);

  const toggleKeyword = (kw: string) => {
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
    } else if (selectedKeywords.length < 5) {
      setSelectedKeywords([...selectedKeywords, kw]);
    } else {
      toast.error("최대 5개까지 선택할 수 있습니다");
    }
  };

  const toggleTime = (t: string) => {
    setSelectedTimes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const toggleDay = (d: string) => {
    setSelectedDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleStep1Next = () => {
    if (!name || !ageGroup || !gender || !address) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (selectedKeywords.length === 0 || !greeting.trim()) {
      toast.error("키워드와 인사말을 입력해주세요.");
      return;
    }
    setStep(3);
  };

  const handleSubmit = () => {
    if (selectedTimes.length === 0) {
      toast.error("대화 가능 시간을 1개 이상 선택해주세요.");
      return;
    }
    setCompleted(true);
    toast.success("어르신 프로필이 등록되었습니다!");
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#E8F8F5' }}>
            <CheckCircle className="w-12 h-12" style={{ color: '#3DAF8A' }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">어르신 프로필 등록 완료!</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            <span className="font-semibold text-gray-700">{name} 어르신</span>의 프로필이 등록되었습니다.<br />
            매칭 가능 상태로 등록되어 청년과 연결 준비가 되었어요.
          </p>

          {/* 프로필 카드 미리보기 */}
          <div className="bg-white rounded-3xl p-6 shadow-lg text-left mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8F8F5' }}>
                <User className="w-8 h-8" style={{ color: '#3DAF8A' }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{name} 어르신</h2>
                <p className="text-sm text-gray-500">{ageGroup} · {gender} · {address}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedKeywords.map(kw => (
                <Badge key={kw} variant="secondary" className="text-xs rounded-full">#{kw}</Badge>
              ))}
            </div>
            <p className="text-sm text-gray-600 italic">"{greeting}"</p>
          </div>

          <div className="p-4 rounded-2xl mb-6" style={{ backgroundColor: '#FFF4E6' }}>
            <p className="text-sm text-gray-700">
              전용 태블릿은 배송 주소로 <strong>무상</strong> 발송됩니다.<br />
              배송 현황은 마이페이지에서 확인할 수 있어요.
            </p>
          </div>

          <Link to="/guardian/dashboard">
            <Button className="w-full rounded-2xl" style={{ backgroundColor: '#3DAF8A' }}>
              대시보드로 이동하기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
            <span className="font-bold text-gray-900">도란도란</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 text-sm">어르신 프로필 등록</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                style={{
                  backgroundColor: step >= s ? '#3DAF8A' : '#E5E7EB',
                  color: step >= s ? 'white' : '#9CA3AF'
                }}
              >{s}</div>
              {s < 3 && <div className="h-0.5 w-12 rounded" style={{ backgroundColor: step > s ? '#3DAF8A' : '#E5E7EB' }} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {step === 1 ? "기본 정보" : step === 2 ? "소개 & 키워드" : "대화 조건"}
          </span>
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">어르신 기본 정보</h1>

            {/* 사진 업로드 */}
            <div className="space-y-2">
              <Label>어르신 사진 (선택)</Label>
              <div
                className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors"
                style={{ backgroundColor: photoUploaded ? '#E8F8F5' : undefined }}
                onClick={() => { setPhotoUploaded(true); toast.success("사진이 등록되었습니다."); }}
              >
                {photoUploaded
                  ? <><CheckCircle className="w-8 h-8 mb-1" style={{ color: '#3DAF8A' }} /><p className="text-sm" style={{ color: '#3DAF8A' }}>사진 등록 완료</p></>
                  : <><Upload className="w-6 h-6 mb-1 text-gray-400" /><p className="text-sm text-gray-400">사진을 업로드하거나 기본 일러스트 사용</p></>
                }
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="seniorName">어르신 이름 <span className="text-red-400 text-xs">*필수</span></Label>
              <Input id="seniorName" value={name} onChange={e => setName(e.target.value)} placeholder="예) 김순자" className="rounded-2xl" />
            </div>

            <div className="space-y-1.5">
              <Label>연령대 <span className="text-red-400 text-xs">*필수</span></Label>
              <div className="flex gap-2 flex-wrap">
                {["60대", "70대", "80대", "90대 이상"].map(ag => (
                  <button
                    key={ag}
                    onClick={() => setAgeGroup(ag)}
                    className="px-4 py-2 rounded-2xl text-sm border-2 transition-colors"
                    style={{
                      borderColor: ageGroup === ag ? '#3DAF8A' : '#E5E7EB',
                      backgroundColor: ageGroup === ag ? '#E8F8F5' : 'white',
                      color: ageGroup === ag ? '#3DAF8A' : '#6B7280'
                    }}
                  >{ag}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>성별 <span className="text-red-400 text-xs">*필수</span></Label>
              <div className="flex gap-3">
                {["여성", "남성"].map(g => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className="flex-1 py-2.5 rounded-2xl text-sm border-2 transition-colors"
                    style={{
                      borderColor: gender === g ? '#3DAF8A' : '#E5E7EB',
                      backgroundColor: gender === g ? '#E8F8F5' : 'white',
                      color: gender === g ? '#3DAF8A' : '#6B7280'
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">주소 <span className="text-red-400 text-xs">*필수</span></Label>
              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="예) 서울시 강남구" className="rounded-2xl" />
              <p className="text-xs text-gray-400">청년에게는 시/구 단위까지만 공개됩니다.</p>
            </div>

            <Button className="w-full rounded-2xl" style={{ backgroundColor: '#3DAF8A' }} onClick={handleStep1Next}>
              다음 단계
            </Button>
          </div>
        )}

        {/* Step 2: 소개 & 키워드 */}
        {step === 2 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">어르신 소개</h1>

            <div className="space-y-2">
              <Label>성향 키워드 <span className="text-sm text-gray-400">(최대 5개)</span></Label>
              <div className="flex flex-wrap gap-2">
                {availableKeywords.map(kw => (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className="px-3 py-1.5 rounded-full text-sm border-2 transition-colors"
                    style={{
                      borderColor: selectedKeywords.includes(kw) ? '#3DAF8A' : '#E5E7EB',
                      backgroundColor: selectedKeywords.includes(kw) ? '#E8F8F5' : 'white',
                      color: selectedKeywords.includes(kw) ? '#3DAF8A' : '#6B7280'
                    }}
                  >#{kw}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="greeting">한 줄 인사말 <span className="text-red-400 text-xs">*필수</span></Label>
              <Textarea
                id="greeting"
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
                placeholder="예) 이야기 나누는 걸 좋아해요. 손주 자랑도 많이 할게요!"
                className="rounded-2xl resize-none"
                rows={3}
                maxLength={60}
              />
              <p className="text-xs text-gray-400 text-right">{greeting.length}/60자</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setStep(1)}>이전</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: '#3DAF8A' }} onClick={handleStep2Next}>다음 단계</Button>
            </div>
          </div>
        )}

        {/* Step 3: 대화 조건 */}
        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-gray-900">대화 조건 설정</h1>

            <div className="space-y-2">
              <Label>대화 가능 시간 <span className="text-red-400 text-xs">*필수 (중복 선택 가능)</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleTime(t)}
                    className="px-3 py-2.5 rounded-2xl text-sm border-2 transition-colors text-left"
                    style={{
                      borderColor: selectedTimes.includes(t) ? '#3DAF8A' : '#E5E7EB',
                      backgroundColor: selectedTimes.includes(t) ? '#E8F8F5' : 'white',
                      color: selectedTimes.includes(t) ? '#3DAF8A' : '#6B7280'
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>대화 가능 요일 <span className="text-sm text-gray-400">(중복 선택 가능)</span></Label>
              <div className="flex gap-2 flex-wrap">
                {dayOptions.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className="w-11 h-11 rounded-2xl text-sm border-2 transition-colors font-semibold"
                    style={{
                      borderColor: selectedDays.includes(d) ? '#3DAF8A' : '#E5E7EB',
                      backgroundColor: selectedDays.includes(d) ? '#E8F8F5' : 'white',
                      color: selectedDays.includes(d) ? '#3DAF8A' : '#6B7280',
                    }}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guardianNote">보호자 요청 사항 (선택)</Label>
              <Textarea
                id="guardianNote"
                value={guardianNote}
                onChange={e => setGuardianNote(e.target.value)}
                placeholder="예) 청각이 약하셔서 천천히 말해주세요. 치매 초기 단계로 반복 질문을 하실 수 있어요."
                className="rounded-2xl resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setStep(2)}>이전</Button>
              <Button className="flex-1 rounded-2xl" style={{ backgroundColor: '#3DAF8A' }} onClick={handleSubmit}>등록 완료</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
