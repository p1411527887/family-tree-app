import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveParentId } from "@/lib/member-relations";
import { assertSameOrigin, requireAdminSession, writeAudit } from "@/lib/request-auth";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const items = await prisma.familyMember.findMany({
    orderBy: [{ generation: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let name = "";
  let role = "Thành viên";
  let generation = "Đời thứ 1";
  let branch = "Chi chính";
  let quote = "";
  let image = "";
  let rawParentId: string | null = null;

  try {
    const body = (await request.json()) as Record<string, string | undefined>;
    name = (body.name ?? "").trim().slice(0, 120);
    role = (body.role ?? role).trim().slice(0, 80);
    generation = (body.generation ?? generation).trim().slice(0, 40);
    branch = (body.branch ?? branch).trim().slice(0, 80);
    quote = (body.quote ?? "").trim().slice(0, 500);
    image = (body.image ?? "").trim().slice(0, 2000);
    rawParentId = body.parentId?.trim() || null;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ ok: false, error: "Tên thành viên là bắt buộc." }, { status: 400 });
  }

  const parent = await resolveParentId(rawParentId);
  if (!parent.ok) {
    return NextResponse.json({ ok: false, error: parent.error }, { status: 400 });
  }

  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const item = await prisma.familyMember.create({
    data: {
      id,
      name,
      role,
      generation,
      branch,
      quote: quote || `${role} — ${name}`,
      image,
      parentId: parent.parentId,
      biography: JSON.stringify([
        `${name} được thêm vào gia phả bởi ${auth.session.username}.`,
      ]),
      verified: false,
    },
  });

  await writeAudit({
    actorId: auth.userId,
    action: "admin.member.create",
    entity: "FamilyMember",
    entityId: item.id,
    meta: { name },
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
