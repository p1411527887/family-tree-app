import { NextResponse } from "next/server";
import { getMembersFromDb } from "@/lib/family-data";

export async function GET() {
  try {
    const items = await getMembersFromDb();
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Không tải được danh sách thành viên." },
      { status: 503 }
    );
  }
}
