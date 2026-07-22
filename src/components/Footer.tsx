"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import Toast from "@/components/Toast";
import RemoteImage from "@/components/RemoteImage";

const LOGO_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDBBU_Flvjefy8k1ybI8pRJopIYqopCQ5MEqsoMR8PpMDtMic0ifFFQpH167hTaO5YCrmuQhkwzGxrKKgSrDq8MqplzzhZhhn8MnzVp_Y3c5sKALjOS_2TtLKMvy042KxBXv-8BmFzCQe73HCF-XSHw8B3-Mr0rsTbycqSC0Z1YZXNzCD5r6iWMyDygUlFGYY9WJD--rhoEWrGZ2h6Vsatmzq3Dw8t52Io-LZQ3T5TPHYHXdZfq80guFvcqchw7uvFiVtFCfNYIcfA";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  async function onSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setToast("Vui lòng nhập email hợp lệ.");
      return;
    }
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setToast(data.error || "Không ghi nhận được đăng ký.");
        return;
      }
      setToast(data.message || "Đã ghi nhận trên máy chủ.");
      setEmail("");
    } catch {
      setToast("Không thể kết nối máy chủ.");
    }
  }

  return (
    <>
      <footer className="bg-surface py-20 border-t-2 border-secondary/30 mt-auto z-10 relative">
        <div className="max-w-container-max mx-auto px-gutter grid md:grid-cols-3 gap-16 items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-1 border border-secondary">
                <RemoteImage
                  alt="Gia Tộc Logo"
                  className="w-10 h-10 object-contain filter brightness-125"
                  src={LOGO_SRC}
                  width={40}
                  height={40}
                />
              </div>
              <span className="font-headline-xl text-xl gold-text tracking-widest">
                Gia Phả Dòng Họ
              </span>
            </div>
            <p className="font-editorial text-on-surface/50 leading-relaxed italic">
              Bảo tồn và phát huy các giá trị văn hóa truyền thống của gia đình. Mỗi thành viên là một mảnh ghép của lịch sử.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="font-label-md text-secondary text-xs uppercase tracking-widest mb-6">
                Liên Kết
              </h5>
              <Link
                href="/contact"
                className="block text-on-surface/60 hover:text-secondary transition-colors text-sm"
              >
                Liên Hệ Gia Tộc
              </Link>
              <Link
                href="/privacy"
                className="block text-on-surface/60 hover:text-secondary transition-colors text-sm"
              >
                Bảo Mật Thông Tin
              </Link>
              <Link
                href="/rules"
                className="block text-on-surface/60 hover:text-secondary transition-colors text-sm"
              >
                Quy Định Tộc Ước
              </Link>
            </div>
            <div className="space-y-4">
              <h5 className="font-label-md text-secondary text-xs uppercase tracking-widest mb-6">
                Mạng Lưới
              </h5>
              <button
                type="button"
                className="block w-full text-left text-on-surface/60 hover:text-secondary transition-colors text-sm"
                onClick={() => setToast("Chi nhánh Phía Bắc — đang cập nhật danh bạ.")}
              >
                Chi Nhánh Phía Bắc
              </button>
              <button
                type="button"
                className="block w-full text-left text-on-surface/60 hover:text-secondary transition-colors text-sm"
                onClick={() => setToast("Chi nhánh Phía Nam — đang cập nhật danh bạ.")}
              >
                Chi Nhánh Phía Nam
              </button>
              <button
                type="button"
                className="block w-full text-left text-on-surface/60 hover:text-secondary transition-colors text-sm"
                onClick={() => setToast("Hải ngoại — đang cập nhật danh bạ.")}
              >
                Hải Ngoại
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="font-label-md text-secondary text-xs uppercase tracking-widest">
              Đăng Ký Truyền Tin
            </h5>
            <form className="relative flex" onSubmit={onSubscribe}>
              <label htmlFor="footer-email" className="sr-only">
                Email đăng ký
              </label>
              <input
                id="footer-email"
                name="email"
                className="bg-wood/50 border border-secondary/30 text-on-surface px-4 py-3 w-full focus:outline-none focus:border-secondary transition-all"
                placeholder="Email..."
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="bg-secondary text-primary px-6 py-3 font-label-md text-xs hover:brightness-110 transition-all"
              >
                GỬI
              </button>
            </form>
            <p className="text-[10px] text-on-surface/40 font-editorial">
              © 2024 Gia Phả Dòng Họ. Toàn bộ bản quyền được bảo hộ bởi truyền thống gia đình.
            </p>
          </div>
        </div>
      </footer>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
