import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePageParams } from "@/lib/pagination";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { page, pageSize, skip } = parsePageParams(searchParams);

  const [total, items] = await Promise.all([
    prisma.newsArticle.count({ where: { published: true } }),
    prisma.newsArticle.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  });
}
