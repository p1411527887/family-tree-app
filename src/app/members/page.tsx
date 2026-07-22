"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RemoteImage from "@/components/RemoteImage";
import type { MemberProfile } from "@/lib/family-data";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function MembersPage() {
  const [directory, setDirectory] = useState<MemberProfile[]>([]);
  const [query, setQuery] = useState("");
  const [generation, setGeneration] = useState("all");
  const [appliedGen, setAppliedGen] = useState("all");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/members");
        const data = (await res.json()) as { ok?: boolean; items?: MemberProfile[] };
        if (!cancelled && data.ok && data.items) {
          setDirectory(
            data.items.filter((m) => m.id.startsWith("showcase-") || !m.id.endsWith("-spouse"))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generations = useMemo(
    () => Array.from(new Set(directory.map((m) => m.generation))).sort(),
    [directory]
  );

  const filtered = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    return directory.filter((m) => {
      const matchGen = appliedGen === "all" || m.generation === appliedGen;
      const matchQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q) ||
        m.quote.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q);
      return matchGen && matchQ;
    });
  }, [appliedGen, appliedQuery, directory]);

  function applyFilter() {
    setAppliedGen(generation);
    setAppliedQuery(query);
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none silk-overlay" />

        <header className="relative z-10 pt-16 pb-12 px-gutter max-w-max-width mx-auto text-center">
          <div className="inline-block relative">
            <div className="absolute -inset-4 border-2 border-secondary-fixed opacity-50" />
            <div className="absolute -inset-2 border border-secondary-fixed opacity-30" />
            <h1 className="font-display-lg text-display-lg text-secondary-fixed uppercase tracking-[0.2em] py-4 px-12 bg-primary-container/80 backdrop-blur-md imperial-border gold-text-glow">
              Đại Gia Đình Dòng Họ
            </h1>
          </div>
          <p className="mt-8 font-title-lg text-title-lg text-on-surface max-w-2xl mx-auto italic opacity-80">
            « Uống nước nhớ nguồn - Tôn vinh cội nguồn, giữ trọn lineage nghìn năm. »
          </p>
        </header>

        <section className="relative z-10 px-gutter max-w-max-width mx-auto mb-20">
          <div className="imperial-scroll p-1 w-full max-w-4xl mx-auto">
            <div className="border-y-2 border-on-tertiary-fixed-variant/20 px-6 md:px-12 py-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full relative">
                <label htmlFor="member-search" className="sr-only">
                  Tìm kiếm thành viên
                </label>
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-tertiary-fixed"
                  aria-hidden
                >
                  search
                </span>
                <input
                  id="member-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                  className="w-full bg-transparent border-b-2 border-on-tertiary-fixed text-on-tertiary-fixed placeholder:text-on-tertiary-fixed/60 focus:ring-0 focus:border-secondary-fixed-dim py-3 pl-12 font-body-lg text-body-lg italic"
                  placeholder="Tìm kiếm tông chi tôn túc..."
                  type="search"
                />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <label htmlFor="generation-filter" className="sr-only">
                  Lọc theo đời
                </label>
                <select
                  id="generation-filter"
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  className="bg-transparent border-none text-on-tertiary-fixed font-label-sm text-label-sm uppercase tracking-wider focus:ring-0 cursor-pointer"
                >
                  <option value="all">Tất cả các Đời</option>
                  {generations.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <div className="h-8 w-px bg-on-tertiary-fixed/20" />
                <button
                  type="button"
                  onClick={applyFilter}
                  className="bg-tertiary-container text-on-surface py-2 px-6 rounded-none font-label-sm text-label-sm uppercase tracking-widest hover:bg-on-tertiary-fixed-variant transition-colors shadow-lg"
                >
                  Lọc Tông Chi
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-gutter max-w-max-width mx-auto pb-24">
          <p className="text-center text-on-surface-variant text-sm mb-8 font-label-md tracking-widest uppercase">
            {loading ? "Đang tải..." : `${filtered.length} thành viên (CSDL)`}
          </p>
          {!loading && filtered.length === 0 ? (
            <p className="text-center text-on-surface-variant italic py-16">
              Không tìm thấy thành viên phù hợp.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filtered.map((m) => (
                <Link
                  key={m.id}
                  href={`/profile/${m.id}`}
                  className="member-card-hover group transition-all duration-500 cursor-pointer relative block"
                >
                  {m.verified && (
                    <div className="absolute -top-4 -right-4 z-20 red-seal px-3 py-2 shadow-xl">
                      <p className="font-label-sm text-[10px] text-on-error-container uppercase font-bold text-center">
                        Gia Tộc
                        <br />
                        Xác Nhận
                      </p>
                    </div>
                  )}
                  <div className="bg-primary-container silk-overlay p-4 imperial-border relative overflow-hidden h-[480px] flex flex-col">
                    <div className="relative w-full aspect-[4/5] border-2 border-secondary-fixed/50 overflow-hidden mb-6 group-hover:border-secondary-fixed transition-colors">
                      <RemoteImage
                        src={m.image}
                        alt={`Chân dung ${m.name}`}
                        fillContainer
                        className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                        sizes="(max-width: 640px) 100vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="mt-auto text-center">
                      <h3 className="font-headline-md text-title-lg text-secondary-fixed mb-1 uppercase tracking-wider">
                        {m.name}
                      </h3>
                      <div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
                        <span className="font-label-sm text-label-sm text-secondary-fixed-dim bg-on-tertiary-fixed/40 px-3 py-1 border border-secondary-fixed-dim/30">
                          {m.generation}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-tighter opacity-70">
                          {m.branch}
                        </span>
                      </div>
                      <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-secondary-fixed to-transparent mb-4 opacity-40" />
                      <p className="font-body-md text-body-md text-on-surface italic opacity-80 line-clamp-2">
                        « {m.quote} »
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="w-full py-12 px-gutter max-w-max-width mx-auto flex items-center justify-center gap-8 opacity-30">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-secondary-fixed to-transparent" />
          <span className="material-symbols-outlined text-4xl text-secondary-fixed" aria-hidden>
            temple_buddhist
          </span>
          <div className="h-1 flex-1 bg-gradient-to-l from-transparent via-secondary-fixed to-transparent" />
        </div>
      </main>
      <Footer />
    </>
  );
}
