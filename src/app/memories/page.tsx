"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMemo, useState } from "react";

type Category = "all" | "image" | "video" | "document" | "heirloom";

type MemoryItem = {
  id: string;
  category: Exclude<Category, "all">;
  badge: string;
  title: string;
  meta: string;
  image: string;
  aspect: string;
};

const ITEMS: MemoryItem[] = [
  {
    id: "1",
    category: "image",
    badge: "Ảnh Tư Liệu",
    title: "Đại gia đình tổ phụ",
    meta: "Canh Thân 1920 • Hà Đông",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCfSDRPyPW_cwfB6q8eN5VEEyrVqo8roueM65-1i3kN67gJVNy5Tf0T8lZl6C2SxbhnbP2hTuLWAmIqGBp23E1-BqEHspLqN8zLqhIsGjFYNhoSc1HwKrQZHYTnH5kCfKvetTEx-zJJeZJ4aRerFqtP4EIlxJg6bgjDdiWm3s-9czix07jy97W6_9TxOfPI-LoJvWHcDMpKDYfp0ZatRLgQhjJ8WgddtIg2QdJH67GD3L9Ahme3szwkuoJ1VeGWMltFcrxecTxVNzg",
    aspect: "aspect-[4/5]",
  },
  {
    id: "2",
    category: "video",
    badge: "Thước Phim Cổ",
    title: "Lễ hội làng Quê Hương",
    meta: "Ất Sửu 1985 • Phóng sự",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBsFRw1MQCSsE34iwMWFaRGCF6hHV3K4p5WwPe24eAt5ovlW3w5Rs9iBqgX9ssCXYfXpJn9Z9bphVzn96vGkJMDtKHArdwanaH6-OFDfatAEK6Z1q5EcjtBw2XpS9iR7btLX0oDEC-u1nVTD6EHryKDbMBusS_VVrzQ8nlGgRyPpunuAoRI7D4f-PwYQC9a_TVxGL91PHK9dGaGRbFXNJPGzBw0Jt30soZrX3kLcswCfreUxxSonE0QV10kVqF5NJQaezmOTkAqp9U",
    aspect: "aspect-square",
  },
  {
    id: "3",
    category: "heirloom",
    badge: "Báu Vật Dòng Họ",
    title: "Bộ ấm trà Minh Mạng",
    meta: "Gìn giữ từ đời thứ năm",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhkIqEjuG3DhKDBNX80lMcaUan3cPyU407K9KXl1mcFYANpsUprA1Z8eh4hEqcFwPfyYl4c3kLkZhUWNXWAfvQO6nnfOVw_6z1y6iBSyTk1ZUZYc3mUxuzYHOC4qf9-OmK7mXpYVQwWLexWnIMvLG1hAeuxh6ckLIwoCGpDhyQfkzV_IqacqFR42KZ_Cvudl4M3km1QcY5WnkW-jLnUdFqGbpIcM2U27tOOJlhySYmMupyaR3N-pTOlNZVfwRzVj6tNV7DQrDpEGk",
    aspect: "aspect-[4/3]",
  },
  {
    id: "4",
    category: "document",
    badge: "Thư Tịch",
    title: "Gia phả bản thảo cổ",
    meta: "Lưu trữ từ đời thứ ba",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCfSDRPyPW_cwfB6q8eN5VEEyrVqo8roueM65-1i3kN67gJVNy5Tf0T8lZl6C2SxbhnbP2hTuLWAmIqGBp23E1-BqEHspLqN8zLqhIsGjFYNhoSc1HwKrQZHYTnH5kCfKvetTEx-zJJeZJ4aRerFqtP4EIlxJg6bgjDdiWm3s-9czix07jy97W6_9TxOfPI-LoJvWHcDMpKDYfp0ZatRLgQhjJ8WgddtIg2QdJH67GD3L9Ahme3szwkuoJ1VeGWMltFcrxecTxVNzg",
    aspect: "aspect-[16/9]",
  },
];

const TABS: { id: Category; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "image", label: "Hình ảnh" },
  { id: "video", label: "Video" },
  { id: "document", label: "Thư tịch" },
  { id: "heirloom", label: "Báu vật" },
];

export default function MemoriesPage() {
  const [tab, setTab] = useState<Category>("all");

  const visible = useMemo(
    () => (tab === "all" ? ITEMS : ITEMS.filter((i) => i.category === tab)),
    [tab]
  );

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <section className="pt-24 pb-12 px-margin-desktop max-w-container-max mx-auto text-center">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Ấn triện gia tộc"
              className="w-16 h-16 opacity-80"
              src="https://lh3.googleusercontent.com/aida/AP1WRLtsM51XGT_Vb-tWXSX34_XcU35T8yp--ZDMZqT4Q_tORRX6rriH5LPGlB4_nH1CMFkzqQiSliFhdvdUzg7WlC3LHTAolzP-VdSGmMyfJcCRMh1StIVelT8AEgee26Npd75t4GcTm_F4Wm7uBlaod77u6rjp-mzdUAR012vyghmgSt9amZfd2tzJzLK1x4XnoOEIqQyMDf_Iv0UdpcSsghb4L8JcOw-s6fSaHywkeRSkCxOEtyrHtyyhag"
            />
          </div>
          <h1 className="font-headline-xl text-headline-xl text-secondary mb-6 tracking-[0.2em] uppercase text-glow">
            Thư Viện Di Sản Dòng Họ
          </h1>
          <div className="gold-divider max-w-md mx-auto" />
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl mx-auto italic leading-relaxed mt-6">
            Nơi thờ cúng và lưu giữ những báu vật ký ức, những thước phim và thư tịch quý báu, truyền lại ngọn lửa cội nguồn cho vạn thế mai sau.
          </p>
        </section>

        <section className="mb-16 px-margin-desktop max-w-container-max mx-auto">
          <div className="flex justify-center gap-8 md:gap-12 overflow-x-auto pb-4" role="tablist" aria-label="Lọc thư viện">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`pb-2 font-label-md text-label-md tracking-widest uppercase whitespace-nowrap transition-colors ${
                    active
                      ? "text-secondary font-bold border-b-2 border-secondary"
                      : "text-on-surface-variant hover:text-secondary border-b-2 border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="px-margin-desktop max-w-container-max mx-auto pb-24">
          {visible.length === 0 ? (
            <p className="text-center text-on-surface-variant italic py-16">Chưa có mục trong danh mục này.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {visible.map((item) => (
                <article key={item.id} className="imperial-container group overflow-hidden">
                  <div className="p-4">
                    <div className={`artifact-frame relative ${item.aspect} overflow-hidden`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.title}
                        className="w-full h-full object-cover sepia-[0.4] group-hover:sepia-0 transition-all duration-1000 scale-[1.02] group-hover:scale-110"
                        src={item.image}
                      />
                      {item.category === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-black/40 backdrop-blur-sm rounded-full border-2 border-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                            <span className="material-symbols-outlined text-secondary text-5xl" aria-hidden>
                              play_arrow
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 text-center border-t border-secondary/30 bg-black/20">
                    <span className="text-secondary/70 font-label-md text-label-md uppercase tracking-widest block mb-2">
                      {item.badge}
                    </span>
                    <h3 className="text-on-surface font-headline-md text-headline-md mb-1 italic">{item.title}</h3>
                    <p className="text-on-surface-variant font-body-md text-body-md">{item.meta}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
