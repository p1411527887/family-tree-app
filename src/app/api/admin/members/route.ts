import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeParentId, resolveParentId, wouldCreateParentCycle } from "@/lib/member-relations";
import { isRecordNotFoundError, isTransactionConflictError } from "@/lib/prisma-errors";
import { assertSameOrigin, requireAdminSession } from "@/lib/request-auth";

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

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.familyMember.create({
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
    await tx.auditLog.create({
      data: {
        actorId: auth.userId,
        action: "admin.member.create",
        entity: "FamilyMember",
        entityId: created.id,
        meta: JSON.stringify({ name }),
      },
    });
    return created;
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!id || !name) {
    return NextResponse.json({ ok: false, error: "id và tên thành viên là bắt buộc." }, { status: 400 });
  }

  const parentId = normalizeParentId(typeof body.parentId === "string" ? body.parentId : null);
  if (parentId === id) {
    return NextResponse.json({ ok: false, error: "Thành viên không thể là cha/mẹ của chính mình." }, { status: 400 });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const family = await tx.familyMember.findMany({ select: { id: true, parentId: true } });
        const parentById = new Map(family.map((member) => [member.id, member.parentId]));
        if (parentId && !parentById.has(parentId)) {
          return { ok: false as const, error: "Không tìm thấy thành viên cha/mẹ." };
        }
        if (wouldCreateParentCycle(id, parentId, parentById)) {
          return { ok: false as const, error: "Quan hệ cha/mẹ sẽ tạo vòng lặp trong gia phả." };
        }

        const item = await tx.familyMember.update({
          where: { id },
          data: {
            name,
            role: typeof body.role === "string" ? body.role.trim().slice(0, 80) || "Thành viên" : "Thành viên",
            generation: typeof body.generation === "string" ? body.generation.trim().slice(0, 40) || "Đời thứ 1" : "Đời thứ 1",
            branch: typeof body.branch === "string" ? body.branch.trim().slice(0, 80) || "Chi chính" : "Chi chính",
            parentId,
          },
        });
        await tx.auditLog.create({
          data: { actorId: auth.userId, action: "admin.member.update", entity: "FamilyMember", entityId: id, meta: JSON.stringify({ name }) },
        });
        return { ok: true as const, item };
      }, { isolationLevel: "Serializable" });

      if (!result.ok) return NextResponse.json(result, { status: 400 });
      return NextResponse.json(result);
    } catch (error) {
      if (isTransactionConflictError(error)) {
        if (attempt < 2) continue;
        return NextResponse.json({ ok: false, error: "Xung đột cập nhật, vui lòng thử lại." }, { status: 409 });
      }
      if (isRecordNotFoundError(error)) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy thành viên." }, { status: 404 });
      }
      throw error;
    }
  }

  return NextResponse.json({ ok: false, error: "Xung đột cập nhật, vui lòng thử lại." }, { status: 409 });
}

export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim() || "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "id thành viên là bắt buộc." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.familyMember.updateMany({ where: { spouseId: id }, data: { spouseId: null } });
      await tx.familyMember.delete({ where: { id } });
      await tx.auditLog.create({
        data: { actorId: auth.userId, action: "admin.member.delete", entity: "FamilyMember", entityId: id },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy thành viên." }, { status: 404 });
    }
    throw error;
  }
}
