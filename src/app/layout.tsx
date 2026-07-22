import type { Metadata } from "next";
import { Playfair_Display, Lora, Cinzel_Decorative } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["vietnamese", "latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["vietnamese", "latin"],
});

const cinzel = Cinzel_Decorative({
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gia Phả Dòng Họ - Tôn Vinh Cội Nguồn",
  description:
    "Bảo tồn và phát huy các giá trị văn hóa truyền thống của gia đình. Mỗi thành viên là một mảnh ghép của lịch sử.",
};

const MATERIAL_SYMBOLS_HREF =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${playfairDisplay.variable} ${lora.variable} ${cinzel.variable} dark`}
    >
      <head>
        {/* Loaded outside Tailwind CSS pipeline so @import order is not stripped */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_HREF} />
      </head>
      <body className="text-on-surface font-body-md selection:bg-secondary selection:text-primary overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
