import { NextResponse } from "next/server";
import { getTreeFromDb } from "@/lib/family-data";

export async function GET() {
  try {
    const tree = await getTreeFromDb();
    if (!tree) {
      return NextResponse.json(
        { ok: false, error: "Chưa có dữ liệu cây gia phả." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, tree });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Không tải được cây gia phả." },
      { status: 503 }
    );
  }
}
