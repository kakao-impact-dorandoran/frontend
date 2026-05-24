import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Heart, Upload, ArrowLeft, X, Check } from "lucide-react";
import { toast } from "sonner";

const availableKeywords = [
  "차분한", "이야기를 잘 듣는", "식물을 좋아하는", "요리를 좋아하는",
  "음악을 좋아하는", "독서를 좋아하는", "유머러스한", "따뜻한",
  "인내심 있는", "공감을 잘하는", "역사에 관심 있는", "영화를 좋아하는"
];

export default function YouthProfile() {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(["차분한", "이야기를 잘 듣는"]);
  const [bio, setBio] = useState("안녕하세요! 따뜻한 대화를 나누고 싶은 청년입니다 :)");

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else if (selectedKeywords.length < 5) {
      setSelectedKeywords([...selectedKeywords, keyword]);
    } else {
      toast.error("최대 5개까지 선택할 수 있습니다");
    }
  };

  const handleSave = () => {
    toast.success("자기소개가 저장되었습니다!");
  };

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
              <span className="text-xl font-bold text-gray-900">자기소개 수정</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* 프로필 사진 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-4 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
            🧑
          </div>
          <div>
            <p className="font-bold text-gray-900 mb-0.5">최윤정</p>
            <p className="text-gray-400 mb-2" style={{ fontSize: '0.82rem' }}>서울 마포구</p>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
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
            onChange={(e) => setBio(e.target.value.slice(0, 100))}
            placeholder="예: 안녕하세요! 따뜻한 대화를 나누고 싶은 청년입니다 :)"
            rows={3}
            className="rounded-2xl resize-none"
          />
          <p className="text-right text-gray-400 mt-1" style={{ fontSize: '0.75rem' }}>{bio.length} / 100자</p>
        </div>

        {/* 나의 키워드 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-1" style={{ fontSize: '1rem' }}>
            나의 키워드 <span className="text-sm font-normal text-gray-400">(최대 5개)</span>
          </h2>
          <p className="text-gray-400 mb-4" style={{ fontSize: '0.82rem' }}>나를 잘 표현하는 키워드를 골라주세요</p>

          {selectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedKeywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => toggleKeyword(keyword)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white"
                  style={{ backgroundColor: '#FF8A3D', fontWeight: 600 }}
                >
                  #{keyword}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {availableKeywords.filter(k => !selectedKeywords.includes(k)).map((keyword) => (
              <button
                key={keyword}
                onClick={() => toggleKeyword(keyword)}
                className="px-3 py-1.5 rounded-full text-sm border transition-colors hover:border-orange-300"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                #{keyword}
              </button>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
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