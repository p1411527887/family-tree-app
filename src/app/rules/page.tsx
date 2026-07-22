import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RulesPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <div className="max-w-3xl mx-auto px-gutter py-20">
          <h1 className="font-headline-xl text-4xl md:text-5xl gold-gradient-text mb-6">
            Quy Định Tộc Ước
          </h1>
          <div className="gold-divider max-w-xs mb-10" />
          <article className="imperial-card p-8 md:p-12 space-y-4 text-on-surface/80 font-body-md leading-relaxed">
            <ol className="list-decimal list-inside space-y-3">
              <li>Kính trọng tổ tiên, giữ gìn từ đường và nghi lễ truyền thống.</li>
              <li>Bổ sung nhân khẩu phải có xác nhận của chi trưởng hoặc Ban Quản trị.</li>
              <li>Không công bố tư liệu nhạy cảm mà chưa được phép của đương sự.</li>
              <li>Đóng góp công đức và sử liệu được ghi nhận minh bạch trong sớ ký.</li>
              <li>Tranh chấp nội bộ giải quyết theo tinh thần hòa hiếu, ưu tiên hòa giải.</li>
            </ol>
            <p className="italic text-secondary/80 pt-4">
              Bản tộc ước đầy đủ sẽ được Ban Quản trị công bố sau đại hội họ.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
