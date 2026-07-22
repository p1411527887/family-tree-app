import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRecordNotFoundError } from "@/lib/prisma-errors";
import { assertSameOrigin, requireAdminSession, writeAudit } from "@/lib/request-auth";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const items = await prisma.adminRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, items });
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin không hợp lệ." }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let id = "";
  let status: "approved" | "rejected" | "" = "";
  try {
    const body = (await request.json()) as { id?: string; status?: string };
    id = body.id ?? "";
    if (body.status === "approved" || body.status === "rejected") {
      status = body.status;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!id || !status) {
    return NextResponse.json(
      { ok: false, error: "Thiếu id hoặc status (approved|rejected)." },
      { status: 400 }
    );
  }

  let updated;
  try {
    updated = await prisma.adminRequest.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: auth.session.username,
      },
    });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy yêu cầu." },
        { status: 404 }
      );
    }
    throw err;
  }

  await writeAudit({
    actorId: auth.userId,
    action: `admin.request.${status}`,
    entity: "AdminRequest",
    entityId: id,
    meta: { by: auth.session.username },
  });

  return NextResponse.json({ ok: true, item: updated });
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
  let branch = "";
  let detail = "";
  let image = "";
  try {
    const body = (await request.json()) as {
      name?: string;
      branch?: string;
      detail?: string;
      image?: string;
    };
    name = (body.name ?? "").trim().slice(0, 120);
    branch = (body.branch ?? "").trim().slice(0, 120);
    detail = (body.detail ?? "").trim().slice(0, 2000);
    image = (body.image ?? "").trim().slice(0, 2000);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON không hợp lệ." }, { status: 400 });
  }

  if (!name || !detail) {
    return NextResponse.json(
      { ok: false, error: "Cần tên và nội dung thỉnh nguyện." },
      { status: 400 }
    );
  }

  const item = await prisma.adminRequest.create({
    data: {
      name,
      branch: branch || "Chưa phân chi",
      detail,
      image,
      status: "pending",
    },
  });

  await writeAudit({
    actorId: auth.userId,
    action: "admin.request.create",
    entity: "AdminRequest",
    entityId: item.id,
  });

  return NextResponse.json({ ok: true, item }, { status: 201 });
}
