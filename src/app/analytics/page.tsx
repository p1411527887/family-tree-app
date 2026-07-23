import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsToolbar from "@/components/AnalyticsToolbar";
import Link from "next/link";
import { getAnalyticsFromDb } from "@/lib/family-data";

const MAP_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAIYdQ-pvAxRyoAd7oVh6CNASKdArs2ozM4W9BGsw5px6zFg8F7VsoYoXSLaL36RVbgqJpITMw_JMSjfVlR3wVvQntBv45JLgevRLKZo7bPUjaGmKk8sWOR8ItZCPFkvDlXUnjpvbvkWJWZjnKsHgwUjGKHfsV90o8NKj0yhLtcK228MJFdgFFh2cVlEAp-Nl6yIOMx-060TwQApY5P9pmj-DdyeNkUcNFAtw8iwgj_1Waaze-7SP08MDSGtrZn9NFTcMk0BGIyE5Q";

export default async function AnalyticsPage() {
  const stats = await getAnalyticsFromDb();
  const genderKnown = stats.male + stats.female;
  const malePct = genderKnown > 0 ? Math.round((stats.male / genderKnown) * 100) : 0;
  const femalePct = genderKnown > 0 ? 100 - malePct : 0;
  const ratio =
    stats.female > 0
      ? (stats.male / stats.female).toFixed(2)
      : stats.male > 0
        ? "∞"
        : "—";

  const maxGen = Math.max(1, ...stats.byGeneration.map((g) => g.count));
  const genBars = stats.byGeneration.map((g) => ({
    label: g.label.replace("Đời thứ ", "Đời "),
    h: `${Math.max(8, Math.round((g.count / maxGen) * 100))}%`,
    n: g.count,
  }));

  const topCities = stats.cityCounts.slice(0, 2);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen analytics-theme">
        <div className="min-h-16 flex items-center justify-between gap-3 px-margin-desktop py-2 border-b border-primary/10 bg-black/40">
          <nav
            className="min-w-0 flex items-center gap-2 font-label-md text-xs sm:text-sm text-primary/80 uppercase tracking-wider sm:tracking-widest"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-primary">
              Sảnh Chính
            </Link>
            <span className="material-symbols-outlined text-xs" aria-hidden>
              chevron_right
            </span>
            <span className="truncate text-primary font-bold border-b border-primary/50">
              Thống kê dòng tộc
            </span>
          </nav>
          <AnalyticsToolbar />
        </div>

        <div className="px-margin-desktop py-12 max-w-container-max w-full mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="font-headline-xl text-headline-xl text-primary gold-glow italic">
              Bản Đồ Nhân Khẩu Dòng Họ
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary" />
              <p className="font-body-md text-primary/70 tracking-widest uppercase text-sm">
                Số liệu từ danh bạ hiện có
              </p>
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary" />
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="imperial-card p-8 group hover:-translate-y-2 transition-all duration-500">
              <p className="font-label-md text-xs text-primary/80 uppercase tracking-[0.2em] mb-3 text-center">
                Tổng thành viên
              </p>
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-5xl text-primary italic gold-glow">
                  {stats.totalMembers}
                </span>
                <span className="font-label-md text-sm text-green-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" aria-hidden>
                    trending_up
                  </span>{" "}
                  Danh bạ số hóa: {stats.catalogSize}
                </span>
              </div>
            </div>
            <div className="imperial-card p-8 group hover:-translate-y-2 transition-all duration-500">
              <p className="font-label-md text-xs text-primary/80 uppercase tracking-[0.2em] mb-3 text-center">
                Tổng số đời
              </p>
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-5xl text-primary italic gold-glow">
                  {stats.generations}
                </span>
                <span className="font-caption text-sm text-primary/60 mt-2 italic">
                  Thế hệ kế tục
                </span>
              </div>
            </div>
            <div className="imperial-card p-8 group hover:-translate-y-2 transition-all duration-500">
              <p className="font-label-md text-xs text-primary/80 uppercase tracking-[0.2em] mb-3 text-center">
                Nam giới
              </p>
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-5xl text-primary italic gold-glow">
                  {stats.male}
                </span>
                <span className="font-label-md text-sm text-primary/70 mt-2">
                  {genderKnown > 0 ? `Chiếm ${malePct}%` : "Chưa phân loại"}
                </span>
              </div>
            </div>
            <div className="imperial-card p-8 group hover:-translate-y-2 transition-all duration-500">
              <p className="font-label-md text-xs text-primary/80 uppercase tracking-[0.2em] mb-3 text-center">
                Nữ giới
              </p>
              <div className="flex flex-col items-center">
                <span className="font-headline-lg text-5xl text-primary italic gold-glow">
                  {stats.female}
                </span>
                <span className="font-label-md text-sm text-primary/70 mt-2">
                  {genderKnown > 0 ? `Chiếm ${femalePct}%` : "Chưa phân loại"}
                </span>
              </div>
            </div>
          </section>

          {stats.unknownGender > 0 && (
            <p className="text-center text-sm text-primary/50 italic">
              {stats.unknownGender} thành viên chưa suy ra giới tính từ vai trò/tên (ước lượng).
            </p>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 imperial-card p-5 sm:p-10 min-w-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-10 sm:mb-12">
                <h3 className="font-headline-md text-headline-md text-primary italic">
                  Sự phát triển qua các đời
                </h3>
                <div className="flex gap-3 items-center">
                  <span className="w-3 h-3 border border-primary bg-primary shadow-[0_0_8px_#FFD700]" />
                  <span className="font-label-md text-sm text-primary/80 tracking-wide uppercase">
                    Số lượng thành viên
                  </span>
                </div>
              </div>
              <div className="relative h-72 flex items-end justify-between px-2 sm:px-8 gap-2 sm:gap-4 overflow-hidden">
                {genBars.length === 0 ? (
                  <p className="text-primary/50 italic w-full text-center self-center">
                    Chưa có dữ liệu đời.
                  </p>
                ) : (
                  genBars.map((bar) => (
                    <div key={bar.label} className="flex-1 min-w-0 flex flex-col items-center group">
                      <div
                        className="w-full bg-gradient-to-t from-secondary/80 to-primary border-x border-t border-primary/50 transition-all duration-700 group-hover:brightness-125 relative"
                        style={{ height: bar.h }}
                      >
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 font-label-md text-sm text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity italic">
                          {bar.n}
                        </span>
                      </div>
                      <p className="mt-6 font-label-md text-[10px] sm:text-xs text-primary/80 uppercase tracking-normal sm:tracking-widest text-center">
                        {bar.label}
                      </p>
                    </div>
                  ))
                )}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-primary w-full" />
                  <div className="border-t border-primary w-full" />
                  <div className="border-t border-primary w-full" />
                  <div className="border-t border-primary w-full" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 imperial-card p-5 sm:p-10 flex flex-col min-w-0">
              <h3 className="font-headline-md text-headline-md text-primary italic mb-10 text-center">
                Tỷ lệ Cân bằng
              </h3>
              <div className="flex-1 flex items-center justify-center relative">
                <div
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center relative border-4 border-primary/30 p-2 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                  style={{
                    background:
                      genderKnown > 0
                        ? `conic-gradient(#FFD700 0% ${malePct}%, #5D106B ${malePct}% 100%)`
                        : "conic-gradient(#444 0% 100%)",
                  }}
                  role="img"
                  aria-label={`Biểu đồ tỷ lệ nam ${malePct}% nữ ${femalePct}%`}
                >
                  <div className="w-28 h-28 sm:w-36 sm:h-36 bg-surface/90 rounded-full z-10 flex flex-col items-center justify-center border-2 border-primary/50">
                    <span className="font-headline-lg text-primary text-3xl italic">{ratio}</span>
                    <span className="font-caption text-[10px] text-primary/70 uppercase tracking-widest mt-1">
                      Nam / Nữ
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary border border-primary shadow-[0_0_5px_#FFD700]" />
                    <span className="font-body-md text-primary/80">Nam giới</span>
                  </div>
                  <span className="font-label-md font-bold text-primary italic">
                    {stats.male}
                    {genderKnown > 0 ? ` (${malePct}%)` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary/40 border border-primary/50" />
                    <span className="font-body-md text-primary/80">Nữ giới</span>
                  </div>
                  <span className="font-label-md font-bold text-primary italic">
                    {stats.female}
                    {genderKnown > 0 ? ` (${femalePct}%)` : ""}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="imperial-card p-10 flex items-center gap-10 group">
              <div className="w-20 h-20 border-2 border-primary flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 bg-primary/10">
                <span className="material-symbols-outlined text-5xl" aria-hidden>
                  elderly
                </span>
              </div>
              <div>
                <p className="font-label-md text-xs text-primary/80 uppercase tracking-widest mb-2">
                  Độ tuổi trung bình
                </p>
                <h4 className="font-headline-md text-primary italic text-3xl gold-glow">
                  {stats.avgAge !== null ? `${stats.avgAge} Tuổi` : "Chưa đủ dữ liệu"}
                </h4>
                <p className="font-caption text-xs text-primary/60 mt-2 italic">
                  Tính từ năm sinh/mất trong danh bạ
                </p>
              </div>
            </div>
            <div className="imperial-card p-10 flex items-center gap-10 group">
              <div className="w-20 h-20 border-2 border-primary flex items-center justify-center text-primary group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 bg-primary/10">
                <span className="material-symbols-outlined text-5xl" aria-hidden>
                  location_city
                </span>
              </div>
              <div>
                <p className="font-label-md text-xs text-primary/80 uppercase tracking-widest mb-2">
                  Đại bản doanh lưu trú
                </p>
                <h4 className="font-headline-md text-primary italic text-2xl gold-glow">
                  {stats.cities.length ? stats.cities.join(", ") : "Chưa ghi nhận"}
                </h4>
                <p className="font-caption text-xs text-primary/60 mt-2 italic">
                  Phân bổ theo trường cư trú
                </p>
              </div>
            </div>
          </section>

          <section className="imperial-card p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-headline-md text-headline-md text-primary italic">
                Phân bổ địa lý giang sơn
              </h3>
              <Link
                href="/members"
                className="font-label-md text-sm text-primary flex items-center gap-2 hover:brightness-125 border-b border-primary/30 uppercase tracking-widest"
              >
                Chiêm ngưỡng đồ bản{" "}
                <span className="material-symbols-outlined text-sm" aria-hidden>
                  open_in_new
                </span>
              </Link>
            </div>
            <div className="h-96 w-full border-2 border-primary/40 overflow-hidden relative group">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{
                  backgroundImage: `url('${MAP_IMAGE}')`,
                  filter: "sepia(0.8) contrast(1.2) brightness(0.8)",
                }}
                role="img"
                aria-label="Bản đồ phân bổ địa lý dòng họ"
              />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              {topCities[0] && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 p-4 bg-primary/20 border border-primary backdrop-blur-md shadow-2xl">
                  <p className="font-label-md text-sm text-primary font-bold italic tracking-wide">
                    {topCities[0].city}: {topCities[0].count} người
                  </p>
                </div>
              )}
              {topCities[1] && (
                <div className="absolute bottom-1/4 right-1/3 p-4 bg-primary/20 border border-primary backdrop-blur-md shadow-2xl">
                  <p className="font-label-md text-sm text-primary font-bold italic tracking-wide">
                    {topCities[1].city}: {topCities[1].count} người
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
