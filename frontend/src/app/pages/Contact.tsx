import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Heart, Send } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("문의가 접수되었습니다. 빠르게 답변드릴게요!");
    setForm({ name: "", email: "", message: "" });
  };

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
            <Mail className="w-4 h-4" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>문의하기</span>
          </div>
          <h1 className="text-gray-900 mb-3" style={{ fontSize: '2rem', fontWeight: 800 }}>무엇이든 물어보세요</h1>
          <p className="text-gray-500" style={{ fontSize: '0.95rem' }}>서비스에 대해 궁금한 점이 있으시면 언제든 연락주세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF4E6' }}>
                <Mail className="w-5 h-5" style={{ color: '#FF8A3D' }} />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '0.95rem' }}>이메일</h4>
                <p className="text-gray-500" style={{ fontSize: '0.88rem' }}>contact@dorandoran.kr</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F8F5' }}>
                <Phone className="w-5 h-5" style={{ color: '#3DAF8A' }} />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '0.95rem' }}>고객센터</h4>
                <p className="text-gray-500" style={{ fontSize: '0.88rem' }}>1588-0000</p>
                <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>평일 오전 9시 ~ 오후 6시</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EBF4FF' }}>
                <MapPin className="w-5 h-5" style={{ color: '#3D7AFF' }} />
              </div>
              <div>
                <h4 className="text-gray-900 mb-1" style={{ fontWeight: 600, fontSize: '0.95rem' }}>사무실</h4>
                <p className="text-gray-500" style={{ fontSize: '0.88rem' }}>서울특별시 마포구 도란길 12, 3층</p>
              </div>
            </div>

            {/* Response time */}
            <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFF4E6' }}>
              <p className="text-gray-700" style={{ fontWeight: 600, fontSize: '0.9rem' }}>⏱ 평균 응답 시간</p>
              <p className="text-gray-500 mt-1" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                이메일 문의는 영업일 기준 <span style={{ color: '#FF8A3D', fontWeight: 600 }}>24시간 이내</span> 답변드립니다.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <form
            className="bg-white rounded-3xl p-7 shadow-sm space-y-5"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontWeight: 600, fontSize: '0.9rem' }}>이름</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border text-gray-900 outline-none transition-all"
                style={{ borderColor: '#E5E7EB', fontSize: '0.92rem' }}
                onFocus={e => e.currentTarget.style.borderColor = '#FF8A3D'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontWeight: 600, fontSize: '0.9rem' }}>이메일</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border text-gray-900 outline-none transition-all"
                style={{ borderColor: '#E5E7EB', fontSize: '0.92rem' }}
                onFocus={e => e.currentTarget.style.borderColor = '#FF8A3D'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontWeight: 600, fontSize: '0.9rem' }}>문의 내용</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border text-gray-900 outline-none transition-all resize-none"
                style={{ borderColor: '#E5E7EB', fontSize: '0.92rem' }}
                onFocus={e => e.currentTarget.style.borderColor = '#FF8A3D'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                placeholder="궁금하신 내용을 자유롭게 작성해 주세요"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 hover:shadow-md transition-all"
              style={{ backgroundColor: '#FF8A3D', fontWeight: 700, fontSize: '0.95rem' }}
            >
              <Send className="w-4 h-4" />
              문의 보내기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
