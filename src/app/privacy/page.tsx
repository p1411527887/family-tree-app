import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <div className="max-w-3xl mx-auto px-gutter py-20">
          <h1 className="font-headline-xl text-4xl md:text-5xl gold-gradient-text mb-6">
            Bảo Mật Thông Tin
          </h1>
          <div className="gold-divider max-w-xs mb-10" />
          <article className="imperial-card p-8 md:p-12 space-y-4 text-on-surface/80 font-body-md leading-relaxed">
            <p>
              Trang này mô tả cách gia phả xử lý thông tin thành viên trong phiên bản prototype.
            </p>
            <p>
              Dữ liệu đăng nhập demo được lưu bằng cookie phiên trên trình duyệt của bạn, chỉ dùng để
              bảo vệ khu vực quản trị. Không thu thập mật khẩu thật của người dùng bên ngoài.
            </p>
            <p>
              Ảnh và tư liệu minh họa được tải từ nguồn bên ngoài phục vụ giao diện. Bản sản xuất
              nên lưu trữ nội bộ và xin phép chủ sở hữu.
            </p>
            <p>
              Liên hệ Ban Quản trị nếu bạn muốn chỉnh sửa hoặc xóa thông tin liên quan đến mình.
            </p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
