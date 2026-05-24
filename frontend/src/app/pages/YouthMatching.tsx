import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Heart, ArrowLeft, MapPin, Users, Clock, CheckCircle, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";

const MAX_MATCHES = 5; // F-16: 1인당 최대 담당 인원

type Senior = {
  id: number;
  name: string;
  age: number;
  ageGroup: string;
  location: string;
  interests: string[];
  availableTime: string;
  description: string;
  difficulty: string;
  matched: boolean;
};

const mockSeniors: Senior[] = [
  {
    id: 1, name: "김순자 어르신", age: 78, ageGroup: "70대", location: "서울 강남구",
    interests: ["요리", "원예", "옛날 이야기"], availableTime: "오후 2시~4시", difficulty: "보통",
    description: "손자 손녀들이 멀리 있어 가끔 외로워요. 젊은 친구들과 이야기 나누고 싶어요.",
    matched: false
  },
  {
    id: 2, name: "박영수 어르신", age: 82, ageGroup: "80대", location: "서울 송파구",
    interests: ["역사", "독서", "클래식 음악"], availableTime: "오전 10시~12시", difficulty: "활발",
    description: "역사 이야기를 나누는 걸 좋아합니다. 경청을 잘 해주시는 분이면 좋겠어요.",
    matched: false
  },
  {
    id: 3, name: "이영희 어르신", age: 75, ageGroup: "70대", location: "경기 분당구",
    interests: ["영화", "음악", "산책"], availableTime: "저녁 6시~8시", difficulty: "쉬움",
    description: "영화와 음악을 좋아해요. 밝은 성격의 젊은 친구와 대화하고 싶습니다.",
    matched: false
  },
  {
    id: 4, name: "최명자 어르신", age: 80, ageGroup: "80대", location: "서울 마포구",
    interests: ["뜨개질", "전통 음악", "꽃꽂이"], availableTime: "오후 3시~5시", difficulty: "보통",
    description: "뜨개질과 꽃을 좋아해요. 차분하게 이야기 나눌 수 있는 분을 찾아요.",
    matched: false
  },
  {
    id: 5, name: "정해수 어르신", age: 71, ageGroup: "70대", location: "인천 연수구",
    interests: ["바둑", "등산", "낚시"], availableTime: "오전 9시~11시", difficulty: "활발",
    description: "건강을 유지하며 활동적으로 지내고 있습니다. 바둑 이야기 좋아해요.",
    matched: false
  },
];

const DIFFICULTY_COLOR: Record<string, { text: string; bg: string }> = {
  "쉬움":  { text: '#3DAF8A', bg: '#E8F8F5' },
  "보통":  { text: '#3D7AFF', bg: '#EBF4FF' },
  "활발":  { text: '#FF8A3D', bg: '#FFF4E6' },
};

export default function YouthMatching() {
  const [seniors, setSeniors] = useState(mockSeniors);
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
  const [iceBreakingOpen, setIceBreakingOpen] = useState(false);
  const [iceBreakingMsg, setIceBreakingMsg] = useState("");
  const matchedCount = seniors.filter(s => s.matched).length;
  const canMatch = matchedCount < MAX_MATCHES;

  const handleSelectSenior = (senior: Senior) => {
    if (!canMatch && !senior.matched) {
      toast.error(`담당 인원 한도(${MAX_MATCHES}명)에 도달했습니다.`);
      return;
    }
    setSelectedSenior(senior);
    setIceBreakingMsg("");
    setIceBreakingOpen(true);
  };

  const confirmMatch = () => {
    if (!iceBreakingMsg.trim()) {
      toast.error("사전 인사말을 작성해주세요.");
      return;
    }
    setSeniors(prev =>
      prev.map(s => s.id === selectedSenior?.id ? { ...s, matched: true } : s)
    );
    toast.success(`${selectedSenior?.name}과(와) 매칭이 완료되었습니다!`);
    setIceBreakingOpen(false);
    setIceBreakingMsg("");
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/youth">
            <Button variant="ghost" size="sm" className="rounded-2xl">
              <ArrowLeft className="w-4 h-4 mr-2" />뒤로
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6" style={{ color: '#FF8A3D' }} />
            <span className="text-xl font-bold text-gray-900">어르신 매칭</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 담당 인원 현황 (F-16) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF4E6' }}>
              <Users className="w-5 h-5" style={{ color: '#FF8A3D' }} />
            </div>
            <div>
              <p className="font-bold text-gray-900">담당 어르신</p>
              <p className="text-xs text-gray-400">최대 {MAX_MATCHES}명까지 담당 가능</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: matchedCount >= MAX_MATCHES ? '#EF4444' : '#FF8A3D' }}>
              {matchedCount} <span className="text-base text-gray-400">/ {MAX_MATCHES}</span>
            </p>
            {matchedCount >= MAX_MATCHES && (
              <p className="text-xs text-red-400">한도 도달 — 신규 매칭 불가</p>
            )}
          </div>
        </div>

        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">매칭 가능한 어르신</h2>
          <p className="text-sm text-gray-500">원하시는 어르신을 선택하고 첫인사를 남겨주세요</p>
        </div>

        {/* 어르신 카드 목록 (F-13, F-14) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {seniors.map(senior => (
            <div
              key={senior.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ opacity: senior.matched ? 0.85 : 1 }}
            >
              <div className="w-full h-36 relative flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                {senior.matched && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(61,175,138,0.7)' }}>
                    <div className="text-center text-white">
                      <CheckCircle className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-sm font-bold">매칭 완료</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{senior.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={DIFFICULTY_COLOR[senior.difficulty] ?? { text: '#6B7280', bg: '#F3F4F6' }}>
                    {senior.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-gray-400" style={{ fontSize: '0.82rem' }}>
                  <span>{senior.ageGroup}</span>
                  <span>·</span>
                  <MapPin className="w-3 h-3" />
                  <span>{senior.location}</span>
                </div>
                <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {senior.availableTime}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {senior.interests.map(i => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D', fontWeight: 600 }}>
                      {i}
                    </span>
                  ))}
                </div>
                <p className="text-gray-500 mb-4" style={{ fontSize: '0.83rem', lineHeight: 1.6 }}>{senior.description}</p>
                <button
                  disabled={senior.matched || (!canMatch && !senior.matched)}
                  className="w-full py-2.5 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: senior.matched ? '#3DAF8A' : '#FF8A3D',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                  onClick={() => !senior.matched && handleSelectSenior(senior)}
                >
                  {senior.matched ? "매칭됨" : "매칭 신청하기"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {seniors.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>조건에 맞는 어르신이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 사전 인사말 모달 (F-15 - Ice-breaking) */}
      <Dialog open={iceBreakingOpen} onOpenChange={setIceBreakingOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" style={{ color: '#FF8A3D' }} />
              첫인사 남기기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSenior && (
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: '#FAF8F5' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E5E7EB' }}>
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedSenior.name}</p>
                  <p className="text-xs text-gray-400">{selectedSenior.ageGroup} · {selectedSenior.location}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">
                사전 인사말 <span className="text-red-400 text-xs">*필수</span>
              </p>
              <Textarea
                value={iceBreakingMsg}
                onChange={e => setIceBreakingMsg(e.target.value)}
                placeholder="어르신께 전하고 싶은 첫인사를 남겨주세요. 예) 안녕하세요! 저는 음악을 좋아해서 같이 노래 이야기 나누고 싶어요 😊"
                className="rounded-2xl resize-none text-sm"
                rows={4}
                maxLength={200}
              />
              <p className="text-xs text-gray-400 text-right">{iceBreakingMsg.length}/200자</p>
            </div>

            <div className="p-3 rounded-2xl text-xs text-gray-500" style={{ backgroundColor: '#E8F8F5' }}>
              매칭은 별도 수락 절차 없이 즉시 성립됩니다. 인사말은 어르신 보호자에게 전달됩니다.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setIceBreakingOpen(false)}>취소</Button>
              <Button
                className="flex-1 rounded-2xl"
                style={{ backgroundColor: '#FF8A3D' }}
                onClick={confirmMatch}
              >
                매칭 완료
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
