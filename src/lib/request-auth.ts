import { cookies } from "next/headers";
import { AUTH_COOKIE, parseSessionToken, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  return parseSessionToken(token);
}

export async function requireAdminSession(): Promise<
  | { ok: true; session: SessionPayload; userId: string | null }
  | { ok: false; status: number; error: string }
> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { ok: false, status: 401, error: "Yêu cầu đăng nhập quản trị." };
  }

  const user = await prisma.user.findUnique({
    where: { username: session.username },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "admin") {
    return { ok: false, status: 403, error: "Tài khoản không còn quyền quản trị." };
  }

  return { ok: true, session, userId: user.id };
}

/**
 * Best-effort audit write. Primary business writes must not fail the request
 * solely because audit logging failed.
 */
export async function writeAudit(opts: {
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        meta: opts.meta ? JSON.stringify(opts.meta) : null,
      },
    });
  } catch (err) {
    console.error("[audit] write failed", opts.action, err);
  }
}

/**
 * Same-origin POST check (CSRF-ish for cookie sessions).
 * - If Origin is present, it must match Host.
 * - If Origin is absent (curl, server jobs), allow — browsers send Origin on POST.
 */
export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
