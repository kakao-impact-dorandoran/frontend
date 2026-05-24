import { Link } from "react-router";
import { ArrowLeft, Check, Heart, Sparkles, Star } from "lucide-react";

const plans = [
  {
    name: "베이직",
    desc: "처음 시작하는 분께",
    price: "29,000",
    color: { bg: '#FFF4E6', border: '#FFD4A8', badge: null, icon: '#FF8A3D', iconBg: '#FFE8D6' },
    features: ["월 4회 대화", "화상/음성 통화", "리마인드 알림"],
    featured: false,
  },
  {
    name: "스탠다드",
    desc: "가장 많이 선택하는 플랜",
    price: "49,000",
    color: { bg: '#FF8A3D', border: '#FF8A3D', badge: "인기", icon: 'white', iconBg: 'rgba(255,255,255,0.25)' },
    features: ["월 8회 대화", "화상/음성 통화", "전용 태블릿 무상 대여", "관리자 우선 응대"],
    featured: true,
  },
  {
    name: "프리미엄",
    desc: "자주 대화가 필요한 분께",
    price: "89,000",
    color: { bg: '#FFF4E6', border: '#FFD4A8', badge: null, icon: '#FF8A3D', iconBg: '#FFE8D6' },
    features: ["월 16회 대화", "전담 청년 매칭", "전용 태블릿 무상 대여", "24시간 도움 요청"],
    featured: false,
  },
];

export default function Pricing() {
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

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D' }}>
            <Sparkles className="w-4 h-4" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>구독 플랜</span>
          </div>
          <h1 className="text-gray-900 mb-3" style={{ fontSize: '2rem', fontWeight: 800 }}>어르신께 따뜻한 대화를<br />정기적으로 선물하세요</h1>
          <p className="text-gray-500" style={{ fontSize: '0.95rem' }}>언제든지 해지 가능 · 보호자 결제 지원</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-3xl p-7 flex flex-col shadow-sm relative overflow-hidden"
              style={{
                backgroundColor: plan.featured ? plan.color.bg : 'white',
                border: `2px solid ${plan.color.border}`,
                boxShadow: plan.featured ? '0 8px 32px rgba(255,138,61,0.25)' : undefined,
              }}
            >
              {plan.color.badge && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-white/20"
                  style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span className="text-white" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{plan.color.badge}</span>
                </div>
              )}

              <div className="mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: plan.color.iconBg }}>
                  <Heart className="w-6 h-6" style={{ color: plan.color.icon }} />
                </div>
                <h3 className="mb-1" style={{
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  color: plan.featured ? 'white' : '#1F2937'
                }}>{plan.name}</h3>
                <p style={{ fontSize: '0.85rem', color: plan.featured ? 'rgba(255,255,255,0.75)' : '#6B7280' }}>{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: plan.featured ? 'white' : '#1F2937'
                }}>{plan.price}</span>
                <span style={{ color: plan.featured ? 'rgba(255,255,255,0.75)' : '#6B7280', fontSize: '0.9rem' }}>원/월</span>
              </div>

              <ul className="space-y-3 mb-7 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: plan.featured ? 'rgba(255,255,255,0.2)' : '#FFF4E6' }}>
                      <Check className="w-3 h-3" style={{ color: plan.featured ? 'white' : '#FF8A3D' }} />
                    </div>
                    <span style={{ fontSize: '0.88rem', color: plan.featured ? 'rgba(255,255,255,0.9)' : '#374151' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="mt-auto">
                <button
                  className="w-full py-3.5 rounded-2xl transition-all hover:shadow-md"
                  style={plan.featured
                    ? { backgroundColor: 'white', color: '#FF8A3D', fontWeight: 700, fontSize: '0.95rem' }
                    : { backgroundColor: '#FFF4E6', color: '#FF8A3D', fontWeight: 700, fontSize: '0.95rem' }
                  }
                >
                  선택하기
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "언제든 해지 가능", desc: "위약금 없이 자유롭게" },
            { label: "보호자 결제 지원", desc: "자녀 명의로 간편 결제" },
            { label: "첫달 무료 체험", desc: "만족 후 결제하세요" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-2xl px-5 py-4 text-center shadow-sm">
              <p className="text-gray-900 mb-0.5" style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.label}</p>
              <p className="text-gray-400" style={{ fontSize: '0.78rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
