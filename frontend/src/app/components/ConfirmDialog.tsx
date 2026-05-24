import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel = "확인", confirmColor = "#EF4444", onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="rounded-3xl max-w-sm border-0 shadow-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-center text-base">{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <p className="text-center text-sm text-gray-500 -mt-2">{description}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border text-gray-600"
            style={{ borderColor: "#E5E7EB", fontWeight: 600 }}
          >
            취소
          </button>
          <button
            onClick={() => { onConfirm(); }}
            className="flex-1 py-3 rounded-2xl text-white"
            style={{ backgroundColor: confirmColor, fontWeight: 700 }}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
