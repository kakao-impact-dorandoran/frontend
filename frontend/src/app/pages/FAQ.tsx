import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Heart, HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "어떤 분들이 청년 봉사자로 참여하나요?",
    a: "별도의 인터뷰와 신원 확인을 거친 검증된 청년만 매칭됩니다. 모든 청년은 기본 교육을 이수합니다.",
    category: "매칭"
  },
  {
    q: "어르신이 디지털 기기를 잘 못 다루셔도 괜찮나요?",
    a: "전용 태블릿은 큰 버튼 3개(전화하기·목소리 듣기·도움 요청)만으로 사용 가능하도록 설계되어 있습니다.",
    category: "기기"
  },
  {
    q: "결제는 누가 하나요?",
    a: "보호자(자녀) 명의로 결제 수단을 등록하실 수 있고, 어르신은 결제 절차 없이 바로 이용하실 수 있습니다.",
    category: "결제"
  },
  {
    q: "구독을 중간에 변경하거나 해지할 수 있나요?",
    a: "마이페이지에서 언제든지 플랜 변경·일시정지·해지가 가능하며, 차액은 다음 결제일에 정산됩니다.",
    category: "구독"
  },
  {
    q: "대화는 어떻게 이루어지나요?",
    a: "약속된 시간에 청년이 어르신께 화상 또는 음성 통화를 걸면, 어르신은 태블릿의 큰 버튼을 눌러 받기만 하시면 됩니다.",
    category: "대화"
  },
  {
    q: "개인정보는 안전하게 보호되나요?",
    a: "모든 통화는 암호화되며, 청년의 연락처와 어르신의 개인정보는 서로에게 직접 공유되지 않습니다.",
    category: "보안"
  },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  매칭: { bg: '#FFF4E6', text: '#FF8A3D' },
  기기: { bg: '#E8F8F5', text: '#3DAF8A' },
  결제: { bg: '#EBF4FF', text: '#3D7AFF' },
  구독: { bg: '#F0EBFF', text: '#8A3DFF' },
  대화: { bg: '#FFF9E6', text: '#E6A817' },
  보안: { bg: '#FFE8EC', text: '#FF3D5C' },
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>
      <header className="bg-white border-b border-orange-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-2xl text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span style={{ fontSize: '0.9rem' }}>뒤로</span>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" style={{ color: '#FF8A3D' }} />
              <span className="text-gray-900" style={{ fontWeight: 700, fontSize: '1rem' }}>도란도란</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D' }}>
            <HelpCircle className="w-4 h-4" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>자주 묻는 질문</span>
          </div>
          <h1 className="text-gray-900 mb-3" style={{ fontSize: '2rem', fontWeight: 800 }}>무엇이 궁금하신가요?</h1>
          <p className="text-gray-500" style={{ fontSize: '0.95rem' }}>도란도란 서비스에 대해 자주 묻는 질문들을 모았어요</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            const color = categoryColors[item.category];
            return (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all"
                style={{ border: isOpen ? '2px solid #FF8A3D' : '2px solid transparent' }}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.bg, color: color.text, fontWeight: 600 }}
                    >
                      {item.category}
                    </span>
                    <span className="text-gray-900" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.q}</span>
                  </div>
                  <ChevronDown
                    className="w-5 h-5 flex-shrink-0 ml-3 transition-transform"
                    style={{ color: '#FF8A3D', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <div className="h-px mb-4" style={{ backgroundColor: '#FFF4E6' }} />
                    <p className="text-gray-600" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 rounded-3xl p-7 text-center" style={{ backgroundColor: '#FFF4E6' }}>
          <p className="text-gray-700 mb-1" style={{ fontWeight: 600, fontSize: '1rem' }}>원하는 답변을 찾지 못하셨나요?</p>
          <p className="text-gray-500 mb-4" style={{ fontSize: '0.88rem' }}>도란도란 팀이 직접 도와드릴게요</p>
          <Link to="/contact">
            <button
              className="px-7 py-3 rounded-2xl text-white shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 600, fontSize: '0.9rem' }}
            >
              문의하기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
