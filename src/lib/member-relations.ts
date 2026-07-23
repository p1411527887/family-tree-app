import { prisma } from "@/lib/db";

export function normalizeParentId(parentId: string | null | undefined): string | null {
  return parentId?.trim() || null;
}
export function wouldCreateParentCycle(
  memberId: string,
  parentId: string | null,
  parentById: ReadonlyMap<string, string | null>
): boolean {
  const seen = new Set([memberId]);
  let current = parentId;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}


/**
 * Validate optional parentId before writing a FamilyMember.
 * Empty / missing → null. Non-empty must reference an existing member.
 */
export async function resolveParentId(
  parentId: string | null | undefined
): Promise<{ ok: true; parentId: string | null } | { ok: false; error: string }> {
  const normalized = normalizeParentId(parentId);
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
