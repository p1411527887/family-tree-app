"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Toast from "@/components/Toast";
import { useMemo, useState } from "react";

type EventItem = {
  id: string;
  era: string;
  yearLabel: string;
  category: string;
  title: string;
  body: string;
  cta: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

const EVENTS: EventItem[] = [
  {
    id: "1",
    era: "Giáp Thìn (2024)",
    yearLabel: "Tiết Tháng Tư, Niên hiệu 2024",
    category: "Sự Kiện Lớn Giỗ Tổ",
    title: "Sự Kiện Lớn Giỗ Tổ Họ Nguyễn",
    body:
      "Ngày đại gia đình hội ngộ, dâng hương và tri ân công đức tổ tiên tại Từ đường dòng họ. Một nghi lễ trang trọng duy trì nét đẹp đạo lý uống nước nhớ nguồn, kết nối vạn thế bình an.",
    cta: "Xem Toàn Văn Bằng Khen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3EYqjzLIzbwYZczQ2fa9txL0QJF5_bMq9-upmQINiiBmV63oNgB6ETSDiU9K5Gihy-G9LeScWTTZW7mOi_6nawssbFbtq7B9SBcq62h9pWxTYqFB8r7fKmduq-YYOcguc_A05_gc2FtQLHykUKPQB_SqCYSVDssNeWEmOshgdX9jLUSsdMOboehCbdyq0lvJ-mRjJ8stNSLnuAMrYvSvX8vPyrLKhESD09LtOg03naIn6cAkrt1DNv2HQJf8ukfBXMooMUy4Ja-Q",
    imageAlt: "Lễ giỗ tổ tại từ đường",
  },
  {
    id: "2",
    era: "Giáp Thìn (2024)",
    yearLabel: "Tiết Tháng Hai, Niên hiệu 2024",
    category: "Khánh Thọ",
    title: "Khánh Thọ Cụ Tiên Cửu Tuần",
    body:
      "Chúc mừng đại thọ Cụ Tiên tròn 90 tuổi. Con cháu khắp phương trời sum vầy, dâng trà chúc Cụ trường thọ, an khang, là cội tùng bách vững chãi che chở cho cả dòng tộc.",
    cta: "Ghi Chép Kỷ Niệm",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUmo9TwAhhjbHAnvWs2BXr5K35hVw_-0tgiCmlrhloCtKOOeMhHVpUcGSmWu9e1jvB6bmEqR5SCHdXwtNvTm3DqioCl35TdhF9vghAPPLdB3cOiBBrs8kq9J62bHImKVyO9YMQmyq9MTDzUHaW5jNVIBsmfmu1MW5HQmjIJ-RlXf8eUut42o00l1jRPMxosNpRXLMLdmd3FDo9uS15RBii9VXYrweE_TVV36xjSXRbq0uSa_vOguZcEsZC9l9lwJkSHCEhNQbTIY",
    imageAlt: "Lễ mừng thọ 90 tuổi",
    reverse: true,
  },
];

export default function EventsPage() {
  const [era, setEra] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((e) => {
      const matchEra = era === "all" || e.era === era;
      const matchCat = category === "all" || e.category === category;
      const matchQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchEra && matchCat && matchQ;
    });
  }, [era, category, query]);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <section className="relative py-24 overflow-hidden">
          <div className="max-w-container-max mx-auto px-gutter relative z-10 text-center">
            <Reveal>
              <div className="inline-block mb-4">
                <div className="h-px w-24 bg-secondary mx-auto mb-2" />
                <span className="text-secondary font-label-md tracking-[0.3em] uppercase">
                  Di Sản Gia Tộc
                </span>
                <div className="h-px w-24 bg-secondary mx-auto mt-2" />
              </div>
              <h1 className="font-headline-xl text-6xl md:text-8xl mb-8 gold-gradient-text drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">
                Sử Ký Dòng Họ
              </h1>
              <p className="font-body-lg text-on-surface/80 max-w-3xl mx-auto italic leading-relaxed">
                « Cây có gốc mới nở nhành xanh lá, nước có nguồn mới bể rộng sông sâu. »
                <br />
                Nơi ghi chép những bằng khen và chương hồi rực rỡ nhất của đại gia đình qua muôn đời.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="py-12 relative z-40">
          <div className="max-w-4xl mx-auto px-gutter">
            <Reveal className="flex flex-col md:flex-row gap-6 items-center justify-center bg-primary/30 backdrop-blur-md p-8 rounded-xl border border-secondary/30 shadow-2xl">
              <div className="flex flex-wrap gap-6 items-center justify-center w-full md:w-auto">
                <div className="relative group">
                  <label htmlFor="era-filter" className="block text-[10px] text-secondary/60 uppercase tracking-widest mb-1 ml-1">
                    Kỷ nguyên
                  </label>
                  <select
                    id="era-filter"
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                    className="appearance-none bg-surface border border-secondary/50 rounded-lg px-6 py-3 pr-12 focus:border-secondary outline-none font-label-md text-secondary min-w-[160px]"
                  >
                    <option value="all">Toàn bộ niên đại</option>
                    <option value="Giáp Thìn (2024)">Giáp Thìn (2024)</option>
                    <option value="Quý Mão (2023)">Quý Mão (2023)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 bottom-3 pointer-events-none text-secondary" aria-hidden>
                    expand_more
                  </span>
                </div>
                <div className="relative group">
                  <label htmlFor="category-filter" className="block text-[10px] text-secondary/60 uppercase tracking-widest mb-1 ml-1">
                    Phân loại
                  </label>
                  <select
                    id="category-filter"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="appearance-none bg-surface border border-secondary/50 rounded-lg px-6 py-3 pr-12 focus:border-secondary outline-none font-label-md text-secondary min-w-[200px]"
                  >
                    <option value="all">Tất cả điển lệ</option>
                    <option value="Sự Kiện Lớn Giỗ Tổ">Sự Kiện Lớn Giỗ Tổ</option>
                    <option value="Khánh Thọ">Khánh Thọ</option>
                    <option value="Hỷ Sự">Hỷ Sự</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 bottom-3 pointer-events-none text-secondary" aria-hidden>
                    history_edu
                  </span>
                </div>
              </div>
              <div className="w-full md:w-80 relative mt-5 md:mt-0">
                <label htmlFor="event-search" className="block text-[10px] text-secondary/60 uppercase tracking-widest mb-1 ml-1">
                  Tìm trong sử liệu
                </label>
                <input
                  id="event-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-surface border border-secondary/50 rounded-lg pl-12 pr-6 py-3 focus:border-secondary outline-none font-body-md text-on-surface placeholder:text-on-surface/30"
                  placeholder="Tên sự kiện, nhân vật..."
                  type="search"
                />
                <span className="material-symbols-outlined absolute left-4 bottom-3 text-secondary" aria-hidden>
                  search
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="max-w-container-max mx-auto px-gutter">
            {filtered.length === 0 ? (
              <p className="text-center text-on-surface/60 italic py-16">Không có sự kiện khớp bộ lọc.</p>
            ) : (
              filtered.map((event) => (
                <Reveal key={event.id} className="flex flex-col items-center mb-32 group">
                  <div className="text-center mb-12">
                    <span className="font-headline-md text-4xl gold-gradient-text block mb-2 italic">
                      {event.yearLabel}
                    </span>
                    <div className="h-px w-48 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto" />
                  </div>
                  <div className="w-full max-w-5xl imperial-border silk-texture p-1 md:p-2 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="bg-surface/95 p-8 md:p-12 relative overflow-hidden">
                      <div
                        className={`flex flex-col gap-12 items-center ${
                          event.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
                        }`}
                      >
                        <div className="w-full lg:w-1/2">
                          <div className="relative p-2 imperial-border rounded-lg overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={event.imageAlt}
                              className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] hover:grayscale-0"
                              src={event.image}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          </div>
                        </div>
                        <div className="w-full lg:w-1/2 flex flex-col">
                          <div className="mb-4">
                            <span className="text-secondary font-label-md tracking-widest uppercase bg-primary/50 px-4 py-1 border border-secondary/30">
                              {event.category}
                            </span>
                          </div>
                          <h3 className="font-headline-lg text-5xl text-secondary mb-6 leading-tight">
                            {event.title}
                          </h3>
                          <p className="text-on-surface/80 text-lg font-body-md mb-8 leading-relaxed">
                            {event.body}
                          </p>
                          <button
                            type="button"
                            className="self-start text-secondary font-headline-md text-xl flex items-center gap-3 hover:translate-x-4 transition-transform duration-500"
                            onClick={() =>
                              setToast(`« ${event.title} » — bản đầy đủ đang được số hóa (prototype).`)
                            }
                          >
                            {event.cta}{" "}
                            <span className="material-symbols-outlined" aria-hidden>
                              menu_book
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
