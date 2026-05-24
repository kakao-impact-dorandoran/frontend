import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Heart, Users, Calendar, Shield, Video, Phone, MessageCircle, Star, Clock, Smile } from "lucide-react";
import { motion } from "motion/react";

// 재사용 애니메이션 variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: '#FAF8F5' }}>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="container mx-auto px-20 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7" style={{ color: '#FF8A3D' }} />
            <span className="text-xl font-bold text-gray-900">도란도란</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-gray-700">
            <Link to="/about" className="hover:text-gray-900 transition-colors">서비스 소개</Link>
            <Link to="/pricing" className="hover:text-gray-900 transition-colors">구독 안내</Link>
            <Link to="/faq" className="hover:text-gray-900 transition-colors">자주 묻는 질문</Link>
            <Link to="/contact" className="hover:text-gray-900 transition-colors">문의하기</Link>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="rounded-2xl">로그인</Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-2xl" style={{ backgroundColor: '#FF8A3D' }}>시작하기</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-20 py-8">
        <div className="grid md:grid-cols-2 gap-0 items-center py-12">
          {/* 왼쪽 텍스트 — 아래서 위로 */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              따뜻한 대화로<br />세대를 연결합니다
            </h1>
            <p className="text-xl text-gray-500 mb-8 leading-relaxed">
              은둔 청년과 어르신을 연결하여 서로에게 의미 있는 시간을 선물합니다.<br />청년에게는 사회 참여의 기회를, 어르신께는 따뜻한 대화를 제공합니다.
            </p>
            <div className="flex gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-10 py-6 rounded-full" style={{ backgroundColor: '#FF8A3D' }}>
                  청년으로 시작하기
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="text-lg px-10 py-6 rounded-full border-gray-300 text-gray-700">
                  어르신으로 시작하기
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* 오른쪽 카드 — 오른쪽에서 슬라이드 */}
          <motion.div
            className="relative flex items-center justify-center"
            variants={fadeRight}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#FF8A3D' }} />
            <div className="absolute w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#FF8A3D' }} />

            <div className="relative z-10 w-full max-w-md">
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-auto text-sm text-gray-400">도란도란 통화 중</span>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: '#FFE8D6' }}>
                      👴
                    </div>
                    <span className="text-sm font-semibold text-gray-700">김영수 어르신</span>
                    <span className="text-xs text-gray-400">서울 · 74세</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-1.5 rounded-full" style={{ height: `${10 + (i % 3) * 8}px`, backgroundColor: '#FF8A3D', opacity: 0.6 + i * 0.08 }} />
                      ))}
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: '#FF8A3D' }}>
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#FF8A3D' }}>12:34</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: '#D4EDE4' }}>
                      🧑‍💻
                    </div>
                    <span className="text-sm font-semibold text-gray-700">이민준 청년</span>
                    <span className="text-xs text-gray-400">서울 · 26세</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%]">
                      <p className="text-sm text-gray-700">오늘 날씨가 참 좋네요 😊</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%]" style={{ backgroundColor: '#FFE8D6' }}>
                      <p className="text-sm text-gray-700">맞아요! 산책 다녀오셨어요?</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <div className="flex-1 bg-white rounded-2xl shadow px-4 py-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: '#FF8A3D' }}>1,240+</p>
                  <p className="text-xs text-gray-500 mt-1">누적 연결</p>
                </div>
                <div className="flex-1 bg-white rounded-2xl shadow px-4 py-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: '#3DAF8A' }}>98%</p>
                  <p className="text-xs text-gray-500 mt-1">만족도</p>
                </div>
                <div className="flex-1 bg-white rounded-2xl shadow px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">4.9</p>
                  <p className="text-xs text-gray-500 mt-1">⭐ 평점</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center text-gray-900 mb-16"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            어떻게 연결되나요?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { bg: '#FFF4E6', icon: <Users className="w-10 h-10" style={{ color: '#FF8A3D' }} />, title: '1. 프로필 등록', desc: '청년은 자신의 관심사와 키워드를 등록하고, 어르신은 선호하는 대화 스타일을 선택합니다.' },
              { bg: '#E8F8F5', icon: <Heart className="w-10 h-10" style={{ color: '#FF8A3D' }} />, title: '2. 매칭', desc: '관심사와 성향을 고려하여 자동으로 최적의 매칭 상대를 추천해드립니다.' },
              { bg: '#FFF9E6', icon: <Calendar className="w-10 h-10" style={{ color: '#FF8A3D' }} />, title: '3. 대화 시작', desc: '일정을 조율하고, 화상 또는 음성 통화로 따뜻한 대화를 나눠보세요.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={i * 0.15}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: card.bg }}>
                  {card.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="container mx-auto px-4">

          {/* 어르신 혜택 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            {/* 태블릿 목업 — 왼쪽에서 슬라이드 */}
            <motion.div
              className="flex items-center justify-center"
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative w-full max-w-sm">
                <div className="bg-gray-800 rounded-[2.8rem] p-4 shadow-2xl">
                  <div className="rounded-[2.2rem] overflow-hidden" style={{ backgroundColor: '#FAF8F5' }}>
                    <div className="bg-white px-5 py-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                        <span className="font-bold text-gray-900">도란도란</span>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">김영수 어르신 👋</div>
                    </div>
                    <div className="px-5 pt-4 pb-2">
                      <p className="text-sm text-gray-500">오늘도 따뜻한 하루 되세요 🌞</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 px-4 pb-5 pt-1">
                      {[
                        { icon: <Video className="w-8 h-8" style={{ color: '#FF8A3D' }} />, label: '얼굴 보며\n전화하기', sub: '화상 통화', bg: '#FFE8D6' },
                        { icon: <Phone className="w-8 h-8" style={{ color: '#3DAF8A' }} />, label: '목소리만\n듣기', sub: '음성 통화', bg: '#D4EDE4' },
                        { icon: <MessageCircle className="w-8 h-8" style={{ color: '#E6A817' }} />, label: '도움\n요청하기', sub: '긴급 연락', bg: '#FFF4D6' },
                      ].map((btn) => (
                        <div key={btn.sub} className="bg-white rounded-2xl shadow flex flex-col items-center justify-center gap-2 py-4 px-2">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: btn.bg }}>
                            {btn.icon}
                          </div>
                          <p className="text-[11px] font-bold text-gray-800 text-center leading-tight whitespace-pre-line">{btn.label}</p>
                          <p className="text-[9px] text-gray-400">{btn.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 텍스트 — 오른쪽에서 슬라이드 */}
            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="inline-block rounded-2xl px-4 py-2 mb-4 text-sm font-semibold" style={{ backgroundColor: '#FFE8D6', color: '#FF8A3D' }}>
                어르신을 위한 서비스
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">어르신께 드리는 가치</h2>
              <ul className="space-y-5">
                {[
                  { icon: <Smile className="w-6 h-6" />, title: '외로움 해소', desc: '정기적인 대화로 따뜻한 교류를 경험하세요', color: '#FF8A3D', bg: '#FFE8D6' },
                  { icon: <Shield className="w-6 h-6" />, title: '간편한 사용', desc: '태블릿으로 버튼 하나만 누르면 연결됩니다', color: '#3DAF8A', bg: '#D4EDE4' },
                  { icon: <Star className="w-6 h-6" />, title: '안전한 환경', desc: '검증된 청년들과 안심하고 대화하세요', color: '#E6A817', bg: '#FFF4D6' },
                ].map((item, i) => (
                  <motion.li
                    key={item.title}
                    className="flex items-start gap-4"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    custom={i * 0.12}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* 은둔 청년 혜택 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 청년 대시보드 목업 — 왼쪽에서 슬라이드 */}
            <motion.div
              className="flex items-center justify-center"
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-400">안녕하세요 👋</p>
                    <p className="font-bold text-gray-900">이민준 님</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFE8D6' }}>
                    <span className="text-lg">🧑‍💻</span>
                  </div>
                </div>
                <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#FFF4E6' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#FF8A3D' }}>오늘의 일정</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFE8D6' }}>
                      <Video className="w-5 h-5" style={{ color: '#FF8A3D' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">김영수 어르신</p>
                      <p className="text-xs text-gray-500">오후 3:00 · 화상통화</p>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FF8A3D' }}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 mb-3">최근 대화</p>
                <div className="space-y-3">
                  {[
                    { emoji: '👴', name: '김영수 어르신', msg: '오늘도 고마워요~', time: '어제', color: '#FFE8D6' },
                    { emoji: '👵', name: '박순자 어르신', msg: '다음 주에 또 얘기해요!', time: '3일 전', color: '#D4EDE4' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: c.color }}>{c.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.msg}</p>
                      </div>
                      <span className="text-xs text-gray-400">{c.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 텍스트 — 오른쪽에서 슬라이드 */}
            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="inline-block rounded-2xl px-4 py-2 mb-4 text-sm font-semibold" style={{ backgroundColor: '#D4EDE4', color: '#3DAF8A' }}>
                은둔 청년을 위한 서비스
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">은둔 청년에게 드리는 기회</h2>
              <ul className="space-y-5">
                {[
                  { icon: <Heart className="w-6 h-6" />, title: '사회 참여', desc: '집에서 편안하게 의미 있는 활동에 참여하세요', color: '#FF8A3D', bg: '#FFE8D6' },
                  { icon: <Clock className="w-6 h-6" />, title: '유연한 일정', desc: '본인의 페이스에 맞춰 일정을 조율할 수 있습니다', color: '#3DAF8A', bg: '#D4EDE4' },
                  { icon: <MessageCircle className="w-6 h-6" />, title: '경험 축적', desc: '대화와 경청 능력을 키우며 성장하세요', color: '#E6A817', bg: '#FFF4D6' },
                ].map((item, i) => (
                  <motion.li
                    key={item.title}
                    className="flex items-start gap-4"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    custom={i * 0.12}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        className="py-20 text-white"
        style={{ background: 'linear-gradient(135deg, #FF8A3D 0%, #FFB088 100%)' }}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">지금 바로 시작해보세요</h2>
          <p className="text-xl mb-8 opacity-90">따뜻한 대화가 세상을 변화시킵니다</p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-2xl bg-white hover:bg-gray-100" style={{ color: '#FF8A3D' }}>
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 도란도란. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}