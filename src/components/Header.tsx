"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import RemoteImage from "@/components/RemoteImage";

const NAV = [
  { href: "/", label: "Nguồn Gốc" },
  { href: "/tree", label: "Sơ Đồ Gia Phả" },
  { href: "/events", label: "Sự Kiện" },
  { href: "/members", label: "Thành Viên" },
  { href: "/memories", label: "Thư Viện" },
  { href: "/news", label: "Tin Tức" },
  { href: "/analytics", label: "Thống Kê" },
] as const;

const LOGO_SRC =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDBBU_Flvjefy8k1ybI8pRJopIYqopCQ5MEqsoMR8PpMDtMic0ifFFQpH167hTaO5YCrmuQhkwzGxrKKgSrDq8MqplzzhZhhn8MnzVp_Y3c5sKALjOS_2TtLKMvy042KxBXv-8BmFzCQe73HCF-XSHw8B3-Mr0rsTbycqSC0Z1YZXNzCD5r6iWMyDygUlFGYY9WJD--rhoEWrGZ2h6Vsatmzq3Dw8t52Io-LZQ3T5TPHYHXdZfq80guFvcqchw7uvFiVtFCfNYIcfA";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-primary/95 backdrop-blur-md border-b-2 border-secondary/30 fixed w-full top-0 z-50 shadow-2xl">
      <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-24">
        <div className="flex items-center gap-4">
          <div className="p-1 border border-secondary">
            <RemoteImage
              alt="Gia Tộc Logo"
              className="w-12 h-12 object-contain filter brightness-125"
              src={LOGO_SRC}
              width={48}
              height={48}
            />
          </div>
          <Link
            href="/"
            className="font-headline-xl text-2xl gold-text tracking-widest uppercase"
            onClick={() => setOpen(false)}
          >
            Cây Gia Phả
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-label-md text-sm transition-all tracking-widest pb-1 border-b-2 ${
                  active
                    ? "text-secondary border-secondary"
                    : "text-on-surface/70 border-transparent hover:text-secondary hover:border-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary px-6 py-3 font-label-md text-xs tracking-widest transition-all uppercase"
          >
            Truy Lục Gia Phả
          </Link>
          <button
            type="button"
            className="lg:hidden w-12 h-12 flex items-center justify-center border border-secondary/50 text-secondary"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-2xl">
              {open ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="lg:hidden border-t border-secondary/20 bg-primary/98 backdrop-blur-md px-gutter pb-6 pt-4 space-y-2"
          aria-label="Menu di động"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block font-label-md text-sm tracking-widest py-3 px-3 border-l-4 ${
                  active
                    ? "text-secondary border-secondary bg-secondary/10"
                    : "text-on-surface/80 border-transparent hover:text-secondary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block mt-4 text-center border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary px-6 py-3 font-label-md text-xs tracking-widest uppercase"
          >
            Truy Lục Gia Phả
          </Link>
        </nav>
      )}
    </header>
  );
}
