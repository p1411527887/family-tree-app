import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Link from "next/link";
import RemoteImage from "@/components/RemoteImage";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-24 flex-grow">
        {/* Hero Section: The Throne Room */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden royal-gradient">
          <div className="absolute inset-0 opacity-20 citadel-pattern"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
          <div className="max-w-container-max mx-auto px-gutter w-full grid md:grid-cols-2 gap-16 items-center relative z-10 py-20">
            <div className="space-y-10 text-center md:text-left">
              <div className="inline-block border-y border-secondary/40 py-2 mb-4">
                <span className="text-secondary font-label-md tracking-[0.3em] uppercase text-xs">
                  Uống Nước Nhớ Nguồn
                </span>
              </div>
              <h1 className="font-headline-xl text-5xl md:text-7xl leading-tight gold-text">
                Vĩnh Cửu <br />
                <span className="italic text-on-surface">Trường Tồn</span>
              </h1>
              <p className="font-editorial text-xl text-on-surface/80 max-w-lg leading-relaxed silk-texture p-6 border-l-2 border-secondary bg-primary/20">
                Hành trình tìm về cội nguồn, nơi mỗi cái tên là một vì tinh tú trên bầu trời lịch sử gia tộc, rạng rỡ muôn đời sau.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-6">
                <Link
                  href="/tree"
                  className="bg-secondary text-primary px-10 py-5 font-label-md text-sm tracking-widest hover:brightness-110 shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
                >
                  KHAI MỞ CHI PHẢ
                </Link>
                <Link
                  href="/memories"
                  className="border border-secondary/50 text-secondary px-10 py-5 font-label-md text-sm tracking-widest hover:bg-secondary/10 transition-all"
                >
                  KÝ ỨC DÒNG HỌ
                </Link>
              </div>
            </div>
            <div className="flex justify-center relative">
              {/* Symmetrical Ornament Frame */}
              <div className="relative p-12">
                <div className="absolute inset-0 border-[12px] border-secondary/20 rounded-full animate-pulse"></div>
                <div className="relative z-10 p-4 bg-wood shadow-2xl imperial-border">
                  <RemoteImage alt="Majestic golden Banyan tree on dark purple background" className="w-full max-w-md aspect-[4/5] object-cover filter brightness-90 sepia-[0.2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4dr5rNcmBILzjWpqef7077cXfrRHtNT0ktleO2gVvXacX_czuibOw_VpLpeuaq9zaSckJ0tB9TcQv0qiT5s58uXI-6C39fXLJsGvgyYUgap6MCBfk_6rcfPzUciZiE3fUDZaVci05QbDdUWgCSnLd81uCdDoHjWIUxK3cfcz7-fZCBE_HK6XVi6ftrtXAqdeWZNJp5ZSVosXyzr1-Ty5SbGc_0UG_wkZ5HXJ9xDGg-fjQQNT7cF4QutsDfYYaAoQpJdTWRKnoOdk" width={480} height={600} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Imperial Decree: Story Section */}
        <section className="py-32 bg-surface relative">
          <Reveal className="max-w-4xl mx-auto px-gutter text-center space-y-12">
            <div className="flex justify-center items-center gap-6">
              <div className="h-px w-20 bg-secondary/30"></div>
              <span className="material-symbols-outlined text-secondary text-5xl">auto_stories</span>
              <div className="h-px w-20 bg-secondary/30"></div>
            </div>
            <h2 className="font-headline-xl text-4xl gold-text uppercase tracking-widest">
              Lịch Sử Gia Tộc
            </h2>
            <div className="gold-divider mx-auto w-48 mb-8"></div>
            <p className="font-editorial text-2xl text-on-surface/90 leading-[1.8] italic px-12 border-x-2 border-secondary/20">
              « Khởi nguồn từ linh khí của tổ tiên, trải qua ngàn năm văn hiến, gia tộc ta như dòng sông lớn cuộn chảy, bồi đắp phù sa cho những thế hệ mai sau nở rộ tài năng và đức độ. »
            </p>

            <div className="grid grid-cols-3 gap-12 pt-12">
              <div className="space-y-2">
                <div className="text-4xl font-headline-xl text-secondary">MDCCCL</div>
                <div className="text-xs font-label-md uppercase tracking-[0.2em] text-secondary/60">
                  Năm Thành Lập
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-headline-xl text-secondary">XII</div>
                <div className="text-xs font-label-md uppercase tracking-[0.2em] text-secondary/60">
                  Thế Hệ Tiếp Nối
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-headline-xl text-secondary">CDL+</div>
                <div className="text-xs font-label-md uppercase tracking-[0.2em] text-secondary/60">
                  Thành Viên Đoàn Tụ
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Genealogy Tree Summary */}
        <section className="py-32 bg-wood/30 relative border-y-4 border-secondary/10">
          <div className="absolute inset-0 opacity-5 citadel-pattern"></div>
          <div className="max-w-container-max mx-auto px-gutter relative">
            <div className="text-center mb-24">
              <h2 className="font-headline-xl text-4xl gold-text mb-4 uppercase tracking-wider">
                Sơ Đồ Gia Phả
              </h2>
              <p className="text-secondary/60 font-editorial italic tracking-widest text-lg">
                Phả hệ trang trọng qua các thế hệ
              </p>
              <div className="gold-divider w-32 mx-auto mt-6"></div>
            </div>

            <Reveal className="relative overflow-x-auto pb-20">
              <div className="flex flex-col items-center min-w-[900px] space-y-16">
                {/* Grandparents */}
                <div className="flex gap-20">
                  <div className="text-center group">
                    <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
                      <RemoteImage alt="Chân dung Ông Cố" className="w-24 h-32 object-cover grayscale brightness-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0cWl9vpNJfW62iKkwsxUWNH9kQyB-ymE9D4zd7Rj5T4Y9YH6ox010MXuWJnhR8dYam1MCj7E8MRhoSDTfYqqIkGlwBICYNsRVKUd3dZAxCRrJ-Dm71fXLXVpGd-qU0NacyTBSEITFCPs2KHPqYwFx45QCYk7Ie8pQm78XUUfswLdu8Nhiwj78k8PupAhLgq_mTjLgJQraqxKZ2FqniOfVLi1M_SjnxCKXfb7HsNZkqjZCMxvadNP-kygp5NNrnSyofkZGD9pIzU0" width={96} height={128} />
                    </div>
                    <h4 className="font-label-md text-secondary text-sm">Ông Cố</h4>
                    <p className="text-[10px] text-on-surface/50 mt-1">1920 - 1995</p>
                  </div>
                  <div className="text-center group">
                    <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
                      <RemoteImage alt="Chân dung Bà Cố" className="w-24 h-32 object-cover grayscale brightness-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHwb6yNlDK2tfkl7y7DwxjW8TR_zs6q9uE-1pSLK6Jvy9VzcBwTYz9Zk50zmOd3kvVAUXXfekgTbxwqsB4JbJmXRgl-ZdTXEAetaOCIYxMeQRFI7axnxpzsP5F_bHIJFceP4zKbyTklOiaKFIj6B10thfbgZHXUSD0VFRwVWK3OA6ungqiBxLh28bmfCM1HWLiP5UepMz2UdE8OKar-lOdudbii40D5gXCTHN1D8zXXefRiQGPjY3uGmoCjMEmHJrIzDxOUT-Qq2o" width={96} height={128} />
                    </div>
                    <h4 className="font-label-md text-secondary text-sm">Bà Cố</h4>
                    <p className="text-[10px] text-on-surface/50 mt-1">1925 - 2005</p>
                  </div>
                </div>

                <div className="w-0.5 h-16 bg-gradient-to-b from-secondary to-transparent"></div>

                {/* Parents */}
                <div className="flex gap-32">
                  <div className="text-center group relative">
                    <div className="absolute -top-8 left-1/2 w-32 h-px bg-secondary/20 -translate-x-1/2"></div>
                    <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
                      <RemoteImage alt="Chân dung Cha" className="w-20 h-28 object-cover brightness-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn3uTtKTSSUXVOQstCHDHg7ThlCm8EushlKxCvUVcIXaHxWXy0tuIf19rSErJMU-stYOjCfP8ORTSf1ure7OhDaeaJeiITUQ-y_e4_n3ni7JCkmFhhGBLFpdFShsaWXEWJJu6gmV0A5Os6ZQ0c1hcPHSlKLjK81uX9pGj0vxiOgI1TGYHmd5mj64CSwHVRgfeeje9k5C57ugCOtYGnoz4TvqaFRz6ErocWGASDdgqNk3Mk450Q74I1awpdf825YRqJbAJ3NQemjl0" width={80} height={112} />
                    </div>
                    <h4 className="font-label-md text-on-surface text-sm">Cha</h4>
                  </div>
                  <div className="text-center group">
                    <div className="portrait-frame mb-4 transform transition-transform group-hover:scale-105">
                      <RemoteImage alt="Chân dung Mẹ" className="w-20 h-28 object-cover brightness-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB68EVY5lmyWI8slryq3sFwt35CVSGnytP7TxIytJbLGJTeVuhHon4EutKwiA-ROGT3_z5EUd6a_9lJ42LqY5HjUqjhY5mOHze7zoUxlols0lWDj2nt4o_DGty96OqesmV-hy4bNUYZIC0sO1EyAgdr6qZaI2-ruXlMubJ1ijeAFJwgzSrCespJtS1JQE3xnIU_TubAYRVUUkxegaGnUne3Hddc6PPBva4OIO9lg1_dpGnU452-NFEEDfteb9lJ__D70xniND5XO4s" width={80} height={112} />
                    </div>
                    <h4 className="font-label-md text-on-surface text-sm">Mẹ</h4>
                  </div>
                </div>

                <div className="w-0.5 h-16 bg-gradient-to-b from-secondary/30 to-transparent"></div>

                {/* Children */}
                <div className="flex gap-16">
                  <div className="text-center group">
                    <div className="p-1 border border-secondary/30 mb-3 bg-wood">
                      <RemoteImage alt="Chân dung Con Trưởng" className="w-16 h-16 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnVtuj_WGeWkuhMpCEIvNL-Nis3EDAQTFF_2HY-g4GO34Du833c3BKW4duKNEkDx6GelvLlJTmQRv9Hvx9RO8MprjO0Y7_bwQ_I9uVoD_GR1qcgkoU7QZv_bwSFdZfwvmAB9pUCdVIIW7OphHFeWj8IQxuOGduJt1uCo0vDpZUL11gPRQ32wTnbVtaHpOWBkL0vNqXD4dRIYQVuz0y_2QXWooZhxKv2yCyJZlKHbK1osVyjUvlt9VwDeXm-pk_5UScZIhx-cfhOS4" width={64} height={64} />
                    </div>
                    <span className="font-body-md text-xs text-on-surface/70">Con Trưởng</span>
                  </div>
                  <div className="text-center group">
                    <div className="p-1 border border-secondary/30 mb-3 bg-wood">
                      <RemoteImage alt="Chân dung Con Gái" className="w-16 h-16 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvz17_GzAh1NzWdExoeTnLsW_7INDx7j_-ioi0q7IvoawwyXUABfjGiBXLdUHK-gzB7G0ygWkUejcImrb8X-OYFs0O6qNFJkAvhU10KpVKsFFy2lCLh8HRq1CrT78g7D0XqsUyacFOJcRKZqRfh0E4kX4sBpBgmcRxFv8ZEDDX3-YVhbwT2jVPlXugegR3O632DemRCChaGsgBa0ixLi6hz-BuIKr5uQ3qYz0wVrnoKn8IoxmhwAMUwcanyBFUrsz_FhOM5018q5A" width={64} height={64} />
                    </div>
                    <span className="font-body-md text-xs text-on-surface/70">Con Gái</span>
                  </div>
                  <div className="text-center group">
                    <div className="p-1 border border-secondary/30 mb-3 bg-wood">
                      <RemoteImage alt="Chân dung Con Út" className="w-16 h-16 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkNVCE6bp6aDuIbViU_9-gx2VeOEBGMjkQwIZSJzXLWYSZdUWrqxrd3Qkpp5BQT6CQ2vS_C7OCXIVExiTuGYRq9fPRC_AVPNfiPgWTebhcxqjTTCZepUqDC1NBeUBD8iS5ca9nOxgTFOkz3gqk2RNAyIV4ZRlaF7t0RVyQAk4xzDYD871__fFxUr-VK_FWUd-NcKSYKV01N1s8DhxiA8hYXMAExQG4ahW42USySSRmr0cJzOt055qV_zzJrU771AA42MuuNfk_LNs" width={64} height={64} />
                    </div>
                    <span className="font-body-md text-xs text-on-surface/70">Con Út</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Chronology: Imperial Scroll */}
        <section className="py-32 bg-primary/20 relative">
          <Reveal className="max-w-container-max mx-auto px-gutter">
            <div className="flex items-center gap-8 mb-20">
              <h2 className="font-headline-xl text-4xl gold-text shrink-0 uppercase tracking-widest">
                Niên Biểu Sự Kiện
              </h2>
              <div className="h-px bg-secondary/30 grow"></div>
            </div>
            <div className="space-y-16 relative before:absolute before:left-1/2 before:w-px before:h-full before:bg-secondary/20">
              {/* Event 1 */}
              <div className="flex items-center justify-between group">
                <div className="w-[45%] text-right pr-12">
                  <time className="font-headline-xl text-2xl text-secondary">2023</time>
                  <h4 className="font-label-md text-lg text-on-surface mt-2 tracking-widest">ĐẠI HỶ CHI LỄ</h4>
                  <p className="font-editorial text-on-surface/60 mt-3">
                    Ngày lành tháng tốt, kết nối hai dòng tộc, khai mở chương mới đầy hứa hẹn.
                  </p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-secondary border-4 border-primary rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] z-10"></div>
                <div className="w-[45%]"></div>
              </div>
              {/* Event 2 */}
              <div className="flex items-center justify-between group flex-row-reverse">
                <div className="w-[45%] text-left pl-12">
                  <time className="font-headline-xl text-2xl text-secondary">2024</time>
                  <h4 className="font-label-md text-lg text-on-surface mt-2 tracking-widest">TRƯỜNG THỌ CHI KHÁNH</h4>
                  <p className="font-editorial text-on-surface/60 mt-3">
                    Mừng thọ Bà Cố, con cháu quây quần tề tựu, bày tỏ lòng hiếu kính sâu sắc.
                  </p>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-secondary border-4 border-primary rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] z-10"></div>
                <div className="w-[45%]"></div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Gallery */}
        <section className="py-32 bg-surface">
          <Reveal className="max-w-container-max mx-auto px-gutter">
            <div className="text-center mb-16">
              <span className="text-secondary/50 font-label-md text-xs tracking-[0.5em] uppercase">Kho Lưu Trữ Dòng Họ</span>
              <h2 className="font-headline-xl text-4xl gold-text mt-4 uppercase">Ảnh Tích Kỷ Niệm</h2>
              <div className="gold-divider w-24 mx-auto mt-6"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[250px]">
              <div className="md:col-span-8 md:row-span-2 imperial-border overflow-hidden group relative">
                <RemoteImage alt="Ảnh đại gia đình Giáp Thìn" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 filter brightness-75 group-hover:brightness-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLXvxafU8w-ngOiSPbaIOjo36hOBZj8VFERbFQsEkAUmn1Byo2EhXNqqc-GabdIBr0iT1V945hbeHQYWrTWwEJdLnSuGGurgrNOr4hzhzGoI6nSOR93yBo69-RERXIcKG8tPDUlbKDhKEEuL_ePl7H70jv-C1YaB9qkkahxRVLKjN7WMokFXMNyph0XtPXALG-xMNn9y62dyfcYfERJpMLOXIYBGDu-Z-Rd7JoUo5AzihmnYGw_dHArSi-9crIpZmDlKaYAKwgL94" width={480} height={600} />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-label-md text-secondary tracking-widest text-lg">Đại Gia Đình - Giáp Thìn Niên</span>
                </div>
              </div>
              <div className="md:col-span-4 imperial-border overflow-hidden">
                <RemoteImage alt="Ảnh kỷ niệm dòng họ" className="w-full h-full object-cover grayscale brightness-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9d4s-O_RRaTIBUIR4jTWLNEoasRnMViu1A-LFLOKE922cL5F43fiR8lByTcaFXQWv_f-XP-2tiSJ66oDqa0h3gnA8_lqsYf_mFlG_2IRrJ7_eYaAIljF_sM9a42D_X5LKSw8_3cvFp7Jzepp_jhzSvcHTXigAT3IrIr3jfd8NqTvtOzNDlPXCougnZI72_TMz9WZzH96eT_tA9hOkEk3_FpJVs3-FesXhBF8IMEINbnAS-nULdpXL5Z5GU4puybkx_oMtKZvSGFA" width={480} height={600} />
              </div>
              <div className="md:col-span-4 imperial-border overflow-hidden">
                <RemoteImage alt="Ảnh lưu trữ gia tộc" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeTw2UNxzXo_prVYLOvq47iXIQHOgyH6EvgCA-Al1anZRtJ5eIeNCwe_qleMXek-4hSvbTUFSYvLzITPqR32vf_e_K-alhfwXwqNFbz1M8wgJhLhdb-gnLCSc4Uzoqpr43PEqg1CTKETEByTUDlUmJ5oFJR3c6a5IBq_0rYfGX2K3HAu5rw4gzhKxzQtcnGS6e_RKlUWtak7cYMA9hOxaEt3hF0wUbgxC13w0xldgO25xZA9ZHBOG5maQVpYCgLlLxG4Lkf2cK8hI" width={480} height={600} />
              </div>
            </div>
          </Reveal>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 bg-wood relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 citadel-pattern scale-150 rotate-12"></div>
          <Reveal className="max-w-4xl mx-auto px-gutter text-center relative z-10 space-y-10">
            <h2 className="font-headline-xl text-4xl gold-text italic">
              « Dù đi đâu, về đâu, dòng máu tổ tiên vẫn luôn chảy trong tim. »
            </h2>
            <div className="flex justify-center gap-8">
              <Link
                href="/login"
                className="bg-secondary text-primary px-12 py-5 font-label-md text-sm tracking-widest hover:scale-105 transition-all shadow-2xl"
              >
                KHỞI TẠO DI SẢN
              </Link>
              <Link
                href="/members"
                className="border-2 border-secondary text-secondary px-12 py-5 font-label-md text-sm tracking-widest hover:bg-secondary/10 transition-all"
              >
                TÌM HIỂU THÊM
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
