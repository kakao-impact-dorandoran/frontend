import { Link } from "react-router";
import { Heart, Users, Calendar, ArrowLeft, Sparkles, Shield } from "lucide-react";

export default function About() {
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

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D' }}>
            <Sparkles className="w-4 h-4" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>서비스 소개</span>
          </div>
          <h1 className="text-gray-900 mb-4" style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.3 }}>
            은둔 청년과 어르신을<br />잇는 따뜻한 대화
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto" style={{ fontSize: '1rem', lineHeight: 1.8 }}>
            도란도란은 사회와 단절된 청년에게는 부담 없는 연결을,<br />
            홀로 지내시는 어르신께는 따뜻한 대화 친구를 드립니다.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          <div className="bg-white rounded-3xl p-7 shadow-sm">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#FFF4E6' }}>
              <Users className="w-7 h-7" style={{ color: '#FF8A3D' }} />
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block" style={{ backgroundColor: '#FFF4E6', color: '#FF8A3D' }}>STEP 01</span>
            <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700, fontSize: '1.1rem' }}>프로필 등록</h3>
            <p className="text-gray-500" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>청년은 관심사·키워드를, 어르신은 선호하는 대화 스타일을 등록합니다.</p>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#E8F8F5' }}>
              <Heart className="w-7 h-7" style={{ color: '#3DAF8A' }} />
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block" style={{ backgroundColor: '#E8F8F5', color: '#3DAF8A' }}>STEP 02</span>
            <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700, fontSize: '1.1rem' }}>매칭</h3>
            <p className="text-gray-500" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>관심사·성향을 고려해 자동으로 최적의 매칭 상대를 추천합니다.</p>
          </div>
          <div className="bg-white rounded-3xl p-7 shadow-sm">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#EBF4FF' }}>
              <Calendar className="w-7 h-7" style={{ color: '#3D7AFF' }} />
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block" style={{ backgroundColor: '#EBF4FF', color: '#3D7AFF' }}>STEP 03</span>
            <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700, fontSize: '1.1rem' }}>대화 시작</h3>
            <p className="text-gray-500" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>일정을 조율하고 화상 또는 음성 통화로 따뜻한 대화를 나눕니다.</p>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFF4E6' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#FF8A3D' }} />
            </div>
            <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.2rem' }}>우리가 만드는 변화</h2>
          </div>
          <p className="text-gray-600 mb-4" style={{ lineHeight: 1.9, fontSize: '0.95rem' }}>
            도란도란은 사회와 단절된 은둔 청년에게는 부담 없는 사회 참여의 기회를,
            홀로 지내시는 어르신께는 따뜻한 대화 친구를 연결합니다.
          </p>
          <p className="text-gray-600" style={{ lineHeight: 1.9, fontSize: '0.95rem' }}>
            전용 태블릿과 큰 버튼 인터페이스로 디지털 사용이 어려운 어르신도 손쉽게 이용할 수 있습니다.
          </p>
        </div>

        {/* Safety */}
        <div className="rounded-3xl p-7 mb-10" style={{ backgroundColor: '#FFF4E6' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
              <Shield className="w-6 h-6" style={{ color: '#FF8A3D' }} />
            </div>
            <div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700, fontSize: '1rem' }}>안전한 연결</h3>
              <p className="text-gray-600" style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>
                모든 청년은 신원 확인과 기본 교육을 이수하며, 통화는 암호화됩니다.
                개인정보는 서로에게 직접 공유되지 않아 안심하고 이용하실 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link to="/signup">
            <button
              className="px-10 py-4 rounded-3xl text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 700, fontSize: '1rem' }}
            >
              지금 시작하기 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
