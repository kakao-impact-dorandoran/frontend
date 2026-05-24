import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Heart, ArrowLeft, Pencil, ChevronDown, ChevronUp, Check, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/ConfirmDialog";

const MATCHED_SENIORS = ["김복순 어르신"];

type JournalEntry = {
  id: number;
  seniorName: string;
  date: string;
  duration: string;
  type: "화상통화" | "음성통화";
  content: string;
};

type NewEntry = {
  seniorName: string;
  duration: string;
  type: "화상통화" | "음성통화";
  content: string;
};

export default function YouthActivityJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [newEntry, setNewEntry] = useState<NewEntry>({
    seniorName: MATCHED_SENIORS[0] ?? "",
    duration: "",
    type: "화상통화",
    content: "",
  });
  const [durationInput, setDurationInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleSave = () => {
    if (!newEntry.seniorName) { toast.error("어르신을 선택해주세요"); return; }
    if (!newEntry.content.trim()) { toast.error("소감을 입력해주세요"); return; }

    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const created: JournalEntry = {
      id: Date.now(),
      seniorName: newEntry.seniorName,
      date: today,
      duration: durationInput ? `${durationInput}분` : "-",
      type: newEntry.type,
      content: newEntry.content.trim(),
    };
    setEntries([created, ...entries]);
    setExpandedId(created.id);
    setWriting(false);
    setNewEntry({ seniorName: MATCHED_SENIORS[0] ?? "", duration: "", type: "화상통화", content: "" });
    setDurationInput("");
    toast.success("활동 일지가 저장되었습니다!");
  };

  const handleDelete = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirm(null);
    toast.success("일지가 삭제되었습니다.");
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
              <span className="text-xl font-bold text-gray-900">활동 일지</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "총 대화 수", value: `${entries.length}회` },
            { label: "작성한 일지", value: `${entries.length}개` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl px-4 py-3 text-center shadow-sm">
              <p className="font-bold text-gray-900" style={{ fontSize: '1.1rem' }}>{stat.value}</p>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.75rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 일지 작성 버튼 */}
        {!writing && (
          <button
            onClick={() => setWriting(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mb-6 text-white"
            style={{ backgroundColor: '#FF8A3D', fontWeight: 600 }}
          >
            <Pencil className="w-4 h-4" />
            새 활동 일지 작성
          </button>
        )}

        {/* 일지 작성 폼 */}
        {writing && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-gray-900">새 활동 일지</p>
              <button onClick={() => setWriting(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* 어르신 이름 + 대화 시간 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5">어르신 이름</p>
                <Select value={newEntry.seniorName} onValueChange={(v) => setNewEntry({ ...newEntry, seniorName: v })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="어르신 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCHED_SENIORS.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5">대화 시간(분)</p>
                <input
                  type="number"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="예) 30"
                  min={0}
                  className="w-full px-3 py-2 rounded-2xl border text-sm focus:outline-none focus:border-orange-300"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>
            </div>

            {/* 통화 유형 */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-1.5">통화 유형</p>
              <div className="flex gap-2">
                {(["화상통화", "음성통화"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewEntry({ ...newEntry, type: t })}
                    className="flex-1 py-2 rounded-2xl text-sm border-2 transition-colors"
                    style={{
                      borderColor: newEntry.type === t ? '#FF8A3D' : '#E5E7EB',
                      backgroundColor: newEntry.type === t ? '#FFF4E6' : 'white',
                      color: newEntry.type === t ? '#FF8A3D' : '#6B7280',
                      fontWeight: newEntry.type === t ? 600 : 400,
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* 소감 입력 */}
            <Textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value.slice(0, 500) })}
              placeholder="오늘 대화에서 기억에 남는 순간, 느낀 점, 다음에 이야기하고 싶은 것 등을 자유롭게 적어주세요."
              className="rounded-2xl resize-none mb-1"
              rows={5}
            />
            <p className="text-right text-gray-400 mb-4" style={{ fontSize: '0.75rem' }}>{newEntry.content.length} / 500자</p>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 rounded-2xl" style={{ backgroundColor: '#FF8A3D' }}>
                <Check className="w-4 h-4 mr-2" />
                저장하기
              </Button>
              <Button variant="outline" onClick={() => setWriting(false)} className="rounded-2xl px-6">
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 일지 목록 */}
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#FFE8D6' }}>
                    👴
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900" style={{ fontSize: '0.95rem' }}>{entry.seniorName}</p>
                    <p className="text-gray-500" style={{ fontSize: '0.78rem' }}>
                      {entry.date} · {entry.duration} · {entry.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {expandedId === entry.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {expandedId === entry.id && (
                  <div className="px-5 pb-5">
                    <div className="rounded-2xl px-4 py-3 mb-3" style={{ backgroundColor: '#FAF8F5' }}>
                      <p className="text-gray-700 leading-relaxed" style={{ fontSize: '0.88rem' }}>{entry.content}</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(entry.id)}
                      className="text-xs text-red-400 flex items-center gap-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" /> 일지 삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !writing && (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FFF4E6' }}>
                <BookOpen className="w-8 h-8" style={{ color: '#FF8A3D' }} />
              </div>
              <p className="text-gray-700 font-semibold mb-1">아직 작성된 일지가 없어요</p>
              <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>대화 후 소감을 기록해보세요</p>
            </div>
          )
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="일지를 삭제하시겠습니까?"
        description="삭제된 일지는 복구할 수 없습니다."
        confirmLabel="삭제"
        onConfirm={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
