import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePageParams } from "@/lib/pagination";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const era = searchParams.get("era");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim().toLowerCase();
  const { page, pageSize, skip } = parsePageParams(searchParams, {
    defaultPageSize: 20,
    maxPageSize: 50,
  });

  const items = await prisma.familyEvent.findMany({
    where: {
      published: true,
      ...(era && era !== "all" ? { era } : {}),
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });

  const filtered = q
    ? items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    : items;

  const total = filtered.length;
  const pageItems = filtered.slice(skip, skip + pageSize);

  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items: pageItems,
  });
}
