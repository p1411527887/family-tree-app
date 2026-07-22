import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, writeAudit } from "@/lib/request-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }

  const ip = clientIp(request);
  const rl = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Quá nhiều yêu cầu. Thử lại sau." },
      { status: 429 }
    );
  }

  let name = "";
  let email = "";
  let message = "";
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      message?: string;
    };
    name = (body.name ?? "").trim().slice(0, 120);
    email = (body.email ?? "").trim().toLowerCase().slice(0, 200);
    message = (body.message ?? "").trim().slice(0, 4000);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền họ tên, email hợp lệ và nội dung (≥ 10 ký tự)." },
      { status: 400 }
    );
  }

  const row = await prisma.contactMessage.create({
    data: { name, email, message },
  });

  await writeAudit({
    action: "contact.received",
    entity: "ContactMessage",
    entityId: row.id,
    meta: { email, ip },
  });

  return NextResponse.json({
    ok: true,
    message: "Đã gửi thỉnh nguyện tới Ban Quản trị.",
    id: row.id,
  });
}
