"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LOGO =
  "https://lh3.googleusercontent.com/aida/AP1WRLtsM51XGT_Vb-tWXSX34_XcU35T8yp--ZDMZqT4Q_tORRX6rriH5LPGlB4_nH1CMFkzqQiSliFhdvdUzg7WlC3LHTAolzP-VdSGmMyfJcCRMh1StIVelT8AEgee26Npd75t4GcTm_F4Wm7uBlaod77u6rjp-mzdUAR012vyghmgSt9amZfd2tzJzLK1x4XnoOEIqQyMDf_Iv0UdpcSsghb4L8JcOw-s6fSaHywkeRSkCxOEtyrHtyyhag";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember, next }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirect?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Đăng nhập thất bại.");
        return;
      }
      // Prefer server-validated redirect (open-redirect safe)
      router.push(data.redirect || next || "/admin");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-gutter py-12">
      <div className="text-center mb-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Gia Phả Logo"
          className="w-32 h-32 mx-auto drop-shadow-[0_0_15px_rgba(233,196,0,0.4)]"
          src={LOGO}
        />
        <h1 className="font-headline-md text-display-lg-mobile md:text-display-lg text-secondary mt-6 tracking-wide">
          CỘI NGUỒN VIỆT
        </h1>
        <p className="font-body-md text-on-surface-variant opacity-80 mt-2 italic">
          Uống nước nhớ nguồn - Di sản muôn đời
        </p>
      </div>

      <div className="imperial-frame silk-texture p-8 md:p-12 rounded-lg relative">
        <div className="corner-motif corner-tl" aria-hidden />
        <div className="corner-motif corner-tr" aria-hidden />
        <div className="corner-motif corner-bl" aria-hidden />
        <div className="corner-motif corner-br" aria-hidden />

        <div className="text-center mb-8">
          <h2 className="font-headline-md text-headline-md text-secondary tracking-widest uppercase">
            Đăng Nhập
          </h2>
          <div className="ornamental-divider" />
        </div>

        <form onSubmit={onSubmit} className="space-y-8" method="post" noValidate>
          <div className="relative group">
            <label
              htmlFor="username"
              className="block font-label-sm text-secondary-fixed-dim uppercase tracking-widest mb-2 opacity-70"
            >
              Danh Tính Thành Viên
            </label>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-secondary-fixed-dim mr-3 opacity-60" aria-hidden>
                person_book
              </span>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-decree w-full py-2 font-body-md focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="Nhập tên đăng nhập hoặc email..."
                type="text"
              />
            </div>
          </div>

          <div className="relative group">
            <label
              htmlFor="password"
              className="block font-label-sm text-secondary-fixed-dim uppercase tracking-widest mb-2 opacity-70"
            >
              Mật Khẩu
            </label>
            <div className="flex items-center">
              <span className="material-symbols-outlined text-secondary-fixed-dim mr-3 opacity-60" aria-hidden>
                encrypted
              </span>
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-decree w-full py-2 font-body-md focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="••••••••"
                type="password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between font-label-sm text-on-surface-variant">
            <label htmlFor="remember" className="flex items-center cursor-pointer hover:text-secondary transition-colors">
              <input
                id="remember"
                name="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded-sm border-secondary-fixed-dim bg-transparent text-primary-container focus:ring-secondary-fixed-dim mr-2"
                type="checkbox"
              />
              <span>Ghi nhớ</span>
            </label>
            <button
              type="button"
              className="hover:text-secondary-fixed-dim underline underline-offset-4 decoration-secondary-fixed-dim/30 transition-all"
              onClick={() =>
                setError("Hãy liên hệ Ban Quản trị để khôi phục mật khẩu. Không gửi mật khẩu qua kênh công khai.")
              }
            >
              Quên mật khẩu?
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm font-body-md border border-red-900/50 bg-red-950/40 px-4 py-3" role="alert">
              {error}
            </p>
          )}

          <button
            className="w-full py-4 rounded-sm btn-gold-inlay font-headline-md text-headline-md uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-3 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập"}
            <span className="material-symbols-outlined" aria-hidden>
              shield_person
            </span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="font-body-md text-on-surface-variant opacity-70 mb-4">
            Chưa có danh tính trong gia phả?
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-2 border border-secondary-fixed-dim/30 text-secondary-fixed-dim font-label-sm uppercase tracking-widest hover:bg-secondary-fixed-dim/10 hover:border-secondary-fixed-dim transition-all rounded-sm"
          >
            Khởi tạo chi tộc
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <Suspense fallback={<div className="text-center py-24 text-secondary">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
