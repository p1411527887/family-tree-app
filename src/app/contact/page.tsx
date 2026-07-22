"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setToast(data.error || "Gửi thất bại.");
        return;
      }
      setToast(data.message || "Đã gửi thành công.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setToast("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <div className="max-w-3xl mx-auto px-gutter py-20">
          <h1 className="font-headline-xl text-4xl md:text-5xl gold-gradient-text mb-6">
            Liên Hệ Gia Tộc
          </h1>
          <div className="gold-divider max-w-xs mb-10" />
          <div className="imperial-card p-8 md:p-12 space-y-6 text-on-surface/80 font-body-md leading-relaxed">
            <p>
              Mọi thỉnh nguyện, bổ sung nhân khẩu hoặc đóng góp sử liệu xin gửi về Ban Quản trị gia phả.
              Tin nhắn được lưu trên máy chủ và ghi audit log.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block text-sm text-secondary">
                Họ tên
                <input
                  required
                  className="mt-1 w-full bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm text-secondary">
                Email
                <input
                  required
                  type="email"
                  className="mt-1 w-full bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  name="email"
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm text-secondary">
                Nội dung
                <textarea
                  required
                  minLength={10}
                  className="mt-1 w-full min-h-32 bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  name="message"
                />
              </label>
              <button type="submit" className="btn-imperial px-8 py-3" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi thỉnh nguyện"}
              </button>
            </form>

            <Link href="/login" className="btn-imperial-outline inline-block px-8 py-3 mt-4">
              Đăng nhập quản trị
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
