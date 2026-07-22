import { prisma } from "@/lib/db";

/**
 * Validate optional parentId before writing a FamilyMember.
 * Empty / missing → null. Non-empty must reference an existing member.
 */
export async function resolveParentId(
  parentId: string | null | undefined
): Promise<{ ok: true; parentId: string | null } | { ok: false; error: string }> {
  const normalized = parentId?.trim() || null;
  if (!normalized) {
    return { ok: true, parentId: null };
  }

  const parent = await prisma.familyMember.findUnique({
    where: { id: normalized },
    select: { id: true },
  });

  if (!parent) {
    return { ok: false, error: "parentId không tồn tại." };
  }

  return { ok: true, parentId: normalized };
}
