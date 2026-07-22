"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onClose: () => void;
  durationMs?: number;
};

export default function Toast({ message, onClose, durationMs = 2800 }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(id);
  }, [onClose, durationMs]);

  return (
    <div className="toast-banner" role="status" aria-live="polite">
      {message}
    </div>
  );
}
