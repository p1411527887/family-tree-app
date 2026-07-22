"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export default function AnalyticsToolbar() {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center border border-primary/30 hover:bg-primary/10 transition-colors"
          aria-label="Thông báo"
          onClick={() => setToast("Không có thông báo mới (prototype).")}
        >
          <span className="material-symbols-outlined text-primary" aria-hidden>
            notifications
          </span>
        </button>
        <button
          type="button"
          className="w-12 h-12 flex items-center justify-center border border-primary/30 hover:bg-primary/10 transition-colors"
          aria-label="Cài đặt"
          onClick={() => setToast("Cài đặt thống kê sẽ mở trong bản đầy đủ.")}
        >
          <span className="material-symbols-outlined text-primary" aria-hidden>
            settings
          </span>
        </button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
