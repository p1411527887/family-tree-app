import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  AUTH_COOKIE,
  createSessionToken,
  getPublicAuthConfig,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDatabaseUnavailableError } from "@/lib/prisma-errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/request-auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function POST(request: Request) {
  if (!getPublicAuthConfig().configured) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Máy chủ chưa cấu hình AUTH_SECRET. Xem .env.example.",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const rl = rateLimit(`login:${ip}`, { limit: 8, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Quá nhiều lần thử. Thử lại sau ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let username = "";
  let password = "";
  let remember = false;
  let nextPath = "/admin";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        username?: string;
        password?: string;
        remember?: boolean;
        next?: string;
      };
      username = body.username ?? "";
      password = body.password ?? "";
      remember = Boolean(body.remember);
      nextPath = safeRedirectPath(body.next, "/admin");
    } else {
      const form = await request.formData();
      username = String(form.get("username") ?? "");
      password = String(form.get("password") ?? "");
      remember =
        form.get("remember") === "on" || form.get("remember") === "true";
      nextPath = safeRedirectPath(form.get("next"), "/admin");
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Yêu cầu không hợp lệ." },
      { status: 400 }
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng nhập danh tính và mật khẩu." },
      { status: 400 }
    );
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
  } catch (err) {
    if (isDatabaseUnavailableError(err)) {
      console.error("[auth/login] database unavailable", err);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Cơ sở dữ liệu chưa sẵn sàng. Chạy `npm run db:deploy` (và `npm run db:seed` lần đầu) rồi khởi động lại.",
        },
        { status: 503 }
      );
    }
    throw err;
  }

  const valid =
    user && (await bcrypt.compare(password, user.passwordHash));

  if (!valid || !user) {
    await writeAudit({
      action: "auth.login_failed",
      entity: "user",
      meta: { username: username.trim(), ip },
    });
    return NextResponse.json(
      { ok: false, error: "Danh tính hoặc mật khẩu không đúng." },
      { status: 401 }
    );
  }

  let token: string;
  try {
    token = await createSessionToken(user.username, user.role);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Không thể tạo phiên đăng nhập. Kiểm tra AUTH_SECRET.",
      },
      { status: 500 }
    );
  }

  await writeAudit({
    actorId: user.id,
    action: "auth.login_success",
    entity: "user",
    entityId: user.id,
    meta: { ip },
  });

  const response = NextResponse.json({
    ok: true,
    redirect: nextPath,
    user: { username: user.username, role: user.role },
  });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8,
  });

  return response;
}
