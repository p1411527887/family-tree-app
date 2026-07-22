"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RemoteImage from "@/components/RemoteImage";
import Toast from "@/components/Toast";
import { FormEvent, useEffect, useState } from "react";

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  image: string;
  publishedAt: string;
};

type EventItem = {
  id: string;
  title: string;
  yearLabel: string;
  body: string;
};

function formatPublishedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/news?page=${page}&pageSize=5`);
        const data = (await res.json()) as {
          ok?: boolean;
          items?: NewsItem[];
          page?: number;
          totalPages?: number;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setToast(data.error || "Không tải được bản tin.");
          setItems([]);
          return;
        }
        setItems(data.items ?? []);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
      } catch {
        if (!cancelled) {
          setToast("Không thể kết nối máy chủ.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/events");
        const data = (await res.json()) as { ok?: boolean; items?: EventItem[] };
        if (!cancelled && data.ok && data.items) {
          setEvents(data.items.slice(0, 4));
        }
      } catch {
        /* sidebar optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openDetail(item: NewsItem) {
    setExpandedId((cur) => (cur === item.id ? null : item.id));
  }

  async function onNewsSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setToast("Vui lòng nhập email hợp lệ.");
      return;
    }
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "news" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setToast(data.error || "Không ghi nhận được.");
        return;
      }
      setToast(data.message || "Đã ghi nhận trên máy chủ.");
      setEmail("");
    } catch {
      setToast("Không thể kết nối máy chủ.");
    }
  }

  const pageNums = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
    return start + i;
  });

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <section className="py-24 px-margin-mobile md:px-margin-desktop relative overflow-hidden">
          <div className="max-w-container-max mx-auto text-center">
            <div className="motif-divider mb-8"></div>
            <h1 className="font-headline-xl text-6xl text-secondary mb-6 italic">Xem Bản Tin</h1>
            <p className="font-body-lg text-xl text-white/70 max-w-3xl mx-auto leading-relaxed italic font-light">
              Nơi lưu giữ những chỉ thị, tin mừng và nhịp đập đương đại của dòng tộc. Bản tin được
              truyền đạt từ những bậc trưởng thượng uy tín nhất.
            </p>
            <div className="mt-12 flex justify-center items-center gap-4">
              <div className="h-px w-32 bg-secondary"></div>
              <span className="material-symbols-outlined text-secondary">brightness_5</span>
              <div className="h-px w-32 bg-secondary"></div>
            </div>
          </div>
        </section>

        <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-[70%] space-y-20">
              {loading && items.length === 0 && (
                <p className="text-center text-white/50 italic">Đang tải bản tin…</p>
              )}
              {!loading && items.length === 0 && (
                <p className="text-center text-white/50 italic">
                  Chưa có bản tin. Hãy chạy seed hoặc thêm bài trên máy chủ.
                </p>
              )}
              {items.map((item) => {
                const open = expandedId === item.id;
                return (
                  <article
                    key={item.id}
                    className="scroll-card p-10 md:p-14 flex flex-col md:flex-row gap-10"
                  >
                    <div className="md:w-2/5 gold-frame overflow-hidden bg-black/5">
                      {item.image ? (
                        <RemoteImage
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          src={item.image}
                          width={400}
                          height={400}
                        />
                      ) : (
                        <div className="w-full h-48 md:h-full min-h-[12rem] bg-black/10" />
                      )}
                    </div>
                    <div className="md:w-3/5 flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-secondary border-b-2 border-secondary font-bold text-xs uppercase tracking-[0.2em]">
                          {item.category}
                        </span>
                        <span className="text-gray-500 text-xs italic">
                          {formatPublishedAt(item.publishedAt)}
                        </span>
                      </div>
                      <h2 className="font-headline-md text-3xl text-secondary mb-5 leading-tight italic">
                        {item.title}
                      </h2>
                      <p className="font-body-md text-gray-700 mb-8 leading-relaxed italic">
                        {open ? item.body : item.excerpt}
                      </p>
                      <div className="mt-auto">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="text-secondary font-bold uppercase tracking-widest text-sm flex items-center gap-2 group"
                        >
                          {open ? "Thu gọn" : "Xem chi tiết"}{" "}
                          <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">
                            arrow_right_alt
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="flex justify-center pt-12">
                  <nav className="flex gap-4 items-center" aria-label="Phân trang">
                    <button
                      type="button"
                      aria-label="Trang trước"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="w-12 h-12 flex items-center justify-center border border-secondary text-secondary hover:bg-secondary/20 transition-all disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {pageNums.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n)}
                        className={`font-headline-md text-2xl italic ${
                          page === n ? "text-secondary" : "text-white/40 hover:text-secondary"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Trang sau"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="w-12 h-12 flex items-center justify-center border border-secondary text-secondary hover:bg-secondary/20 transition-all disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </nav>
                </div>
              )}
              <p className="text-center text-white/40 text-xs mt-4 italic">
                Trang {page} / {totalPages}
              </p>
            </div>

            <aside className="lg:w-[30%] space-y-12">
              <div className="bg-surface-imperial/80 p-8 border-2 border-secondary/40 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-surface-imperial px-4 text-secondary">
                  <span className="material-symbols-outlined text-4xl">calendar_month</span>
                </div>
                <h3 className="font-headline-md text-2xl text-secondary text-center mb-10 italic mt-4">
                  Sự Kiện Quan Trọng
                </h3>
                <ul className="space-y-8">
                  {events.length === 0 && (
                    <li className="text-white/50 text-sm italic text-center">Chưa có sự kiện.</li>
                  )}
                  {events.map((ev) => (
                    <li key={ev.id} className="flex gap-6 border-b border-secondary/10 pb-6">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white/90 italic mb-1">{ev.title}</h4>
                        <p className="text-xs text-secondary italic">{ev.yearLabel}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-imperial/40 p-8 border border-white/10">
                <h3 className="font-headline-md text-2xl text-secondary mb-8 italic">
                  Phân Loại Thư Tịch
                </h3>
                <nav className="space-y-4">
                  <a
                    className="flex justify-between items-center group py-2 border-b border-white/5"
                    href="/events"
                  >
                    <span className="text-white/70 group-hover:text-secondary transition-all italic">
                      Sự kiện
                    </span>
                    <span className="text-secondary italic font-bold">{events.length || "—"}</span>
                  </a>
                  <a
                    className="flex justify-between items-center group py-2 border-b border-white/5"
                    href="/members"
                  >
                    <span className="text-white/70 group-hover:text-secondary transition-all italic">
                      Nhân khẩu
                    </span>
                    <span className="material-symbols-outlined text-secondary text-sm">
                      arrow_forward
                    </span>
                  </a>
                </nav>
              </div>

              <div className="bg-primary p-8 border-4 border-double border-secondary text-center">
                <h3 className="font-headline-md text-2xl text-secondary mb-4 italic">
                  Nhận Tin Từ Gia Tộc
                </h3>
                <p className="text-on-surface/70 text-sm mb-8 italic">
                  Đăng ký để nhận những chỉ thị và tin mừng quan trọng nhất của dòng họ.
                </p>
                <form onSubmit={onNewsSubscribe}>
                  <label htmlFor="news-email" className="sr-only">
                    Email nhận tin
                  </label>
                  <input
                    id="news-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-secondary/30 py-3 px-4 text-on-surface text-center focus:ring-1 focus:ring-secondary outline-none mb-4 italic"
                    placeholder="Địa chỉ điện tín..."
                    type="email"
                  />
                  <button
                    type="submit"
                    className="w-full bg-secondary text-primary font-black py-3 uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                  >
                    Ghi Danh
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
