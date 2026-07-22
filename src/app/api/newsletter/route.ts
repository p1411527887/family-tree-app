import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/request-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }

  const ip = clientIp(request);
  const rl = rateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Quá nhiều yêu cầu. Thử lại sau." },
      { status: 429 }
    );
  }

  let email = "";
  let source = "footer";
  try {
    const body = (await request.json()) as { email?: string; source?: string };
    email = (body.email ?? "").trim().toLowerCase();
    source = (body.source ?? "footer").slice(0, 40);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }

  await prisma.newsletterSubscription.upsert({
    where: { email },
    create: { email, source },
    update: { source },
  });

  return NextResponse.json({
    ok: true,
    message: "Đã ghi nhận đăng ký truyền tin trên máy chủ.",
  });
}
