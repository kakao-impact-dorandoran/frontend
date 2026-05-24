import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Calendar, UserCheck, MessageCircle, X, Check } from "lucide-react";

interface Notification {
  id: number;
  type: "schedule" | "match" | "message";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "schedule",
    title: "일정 알림",
    body: "김순자 어르신과의 화상통화가 1시간 후입니다.",
    time: "방금 전",
    read: false,
  },
  {
    id: 2,
    type: "match",
    title: "매칭 완료",
    body: "박영수 어르신과 새로운 매칭이 성사되었어요!",
    time: "30분 전",
    read: false,
  },
  {
    id: 3,
    type: "message",
    title: "대화 완료",
    body: "이영희 어르신과의 대화가 기록되었습니다.",
    time: "2시간 전",
    read: true,
  },
  {
    id: 4,
    type: "schedule",
    title: "일정 알림",
    body: "내일 오전 10시 이영희 어르신과의 음성통화를 잊지 마세요.",
    time: "어제",
    read: true,
  },
];

const typeConfig = {
  schedule: { icon: Calendar, bg: "#FFF9E6", color: "#E6A817" },
  match: { icon: UserCheck, bg: "#E8F8F5", color: "#3DAF8A" },
  message: { icon: MessageCircle, bg: "#EBF4FF", color: "#3D7AFF" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationPanel({ open, onClose, anchorRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-orange-100 z-50 overflow-hidden"
          style={{ transformOrigin: "top right" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: "#FF8A3D" }} />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a1a" }}>
                알림
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-white text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FF8A3D", fontWeight: 600 }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-xl hover:bg-orange-50 transition-colors"
                  style={{ color: "#FF8A3D", fontWeight: 500 }}
                >
                  <Check className="w-3 h-3" />
                  모두 읽음
                </button>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                알림이 없습니다
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const cfg = typeConfig[n.type];
                  const Icon = cfg.icon;
                  return (
                    <li
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      style={{ backgroundColor: n.read ? "white" : "#FFFBF7" }}
                    >
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="text-xs"
                            style={{ fontWeight: 600, color: "#555" }}
                          >
                            {n.title}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p
                          className="text-sm mt-0.5 leading-snug"
                          style={{ color: n.read ? "#888" : "#333", fontWeight: n.read ? 400 : 500 }}
                        >
                          {n.body}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#FF8A3D" }} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 text-center">
            <button className="text-sm hover:underline" style={{ color: "#FF8A3D", fontWeight: 500 }}>
              모든 알림 보기
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
