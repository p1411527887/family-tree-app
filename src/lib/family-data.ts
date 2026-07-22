import raw from "@/data.json";
import { prisma } from "@/lib/db";

export type Person = {
  name: string;
  role: string;
  dob?: string;
  image: string;
};

export type TreeNodeData = {
  id: string;
  name: string;
  role: string;
  dob?: string;
  image: string;
  spouse?: Person;
  children?: TreeNodeData[];
};

export type MemberProfile = {
  id: string;
  name: string;
  role: string;
  generation: string;
  branch: string;
  quote: string;
  image: string;
  dob?: string;
  birthYear?: string;
  deathYear?: string;
  residence?: string;
  biography: string[];
  spouse?: { id: string; name: string; role: string; dob?: string; image: string };
  children: { id?: string; name: string; role?: string }[];
  verified?: boolean;
};

/** When true (default in non-production), empty/unavailable DB falls back to data.json. */
function allowDataFallback(): boolean {
  if (process.env.ALLOW_DATA_FALLBACK === "1") return true;
  if (process.env.ALLOW_DATA_FALLBACK === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/** Fallback when DB empty (build-time / tests without migrate). */
export const treeDataFallback = raw.treeData as TreeNodeData;

function parseBio(rawBio: string | null | undefined): string[] {
  if (!rawBio) return [];
  try {
    const v = JSON.parse(rawBio) as unknown;
    return Array.isArray(v) ? v.map(String) : [String(rawBio)];
  } catch {
    return [rawBio];
  }
}

type DbMember = {
  id: string;
  name: string;
  role: string;
  generation: string;
  branch: string;
  quote: string;
  image: string;
  dob: string | null;
  birthYear: string | null;
  deathYear: string | null;
  residence: string | null;
  biography: string;
  verified: boolean;
  parentId: string | null;
  spouseId: string | null;
  sortOrder: number;
};

function toProfile(m: DbMember, byId: Map<string, DbMember>): MemberProfile {
  const spouse = m.spouseId ? byId.get(m.spouseId) : undefined;
  const children = [...byId.values()]
    .filter((c) => c.parentId === m.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({ id: c.id, name: c.name, role: c.role }));

  return {
    id: m.id,
    name: m.name,
    role: m.role,
    generation: m.generation,
    branch: m.branch,
    quote: m.quote,
    image: m.image,
    dob: m.dob ?? undefined,
    birthYear: m.birthYear ?? undefined,
    deathYear: m.deathYear ?? undefined,
    residence: m.residence ?? undefined,
    biography: parseBio(m.biography),
    spouse: spouse
      ? {
          id: spouse.id,
          name: spouse.name,
          role: spouse.role,
          dob: spouse.dob ?? undefined,
          image: spouse.image,
        }
      : undefined,
    children,
    verified: m.verified,
  };
}

function buildTreeFromDb(byId: Map<string, DbMember>, rootId = "root"): TreeNodeData | null {
  const root = byId.get(rootId);
  if (!root) return null;

  const build = (id: string): TreeNodeData => {
    const m = byId.get(id)!;
    const spouse = m.spouseId ? byId.get(m.spouseId) : undefined;
    const kids = [...byId.values()]
      .filter((c) => c.parentId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      id: m.id,
      name: m.name,
      role: m.role,
      dob: m.dob ?? undefined,
      image: m.image,
      spouse: spouse
        ? {
            name: spouse.name,
            role: spouse.role,
            dob: spouse.dob ?? undefined,
            image: spouse.image,
          }
        : undefined,
      children: kids.map((k) => build(k.id)),
    };
  };

  return build(rootId);
}

/** Sync fallback for client components / tests — prefer getMembersFromDb on server. */
export function flattenFallbackTree(
  node: TreeNodeData = treeDataFallback,
  depth = 0,
  branch = "Chi chính"
): MemberProfile[] {
  const gen = depth === 0 ? "Đời thứ 1" : `Đời thứ ${depth + 1}`;
  const profiles: MemberProfile[] = [];
  const childList =
    node.children?.map((c) => ({ id: c.id, name: c.name, role: c.role })) ?? [];

  profiles.push({
    id: node.id,
    name: node.name,
    role: node.role,
    generation: gen,
    branch,
    quote: `${node.role} của dòng họ — ${node.dob ?? "niên đại đang cập nhật"}.`,
    image: node.image,
    dob: node.dob,
    birthYear: node.dob?.split("-")[0]?.trim(),
    deathYear: node.dob?.includes("-") ? node.dob.split("-")[1]?.trim() : undefined,
    residence: "Việt Nam",
    biography: [
      `${node.name} (${node.role}) là thành viên quan trọng trong cây gia phả.`,
    ],
    spouse: node.spouse
      ? {
          id: `${node.id}-spouse`,
          name: node.spouse.name,
          role: node.spouse.role,
          dob: node.spouse.dob,
          image: node.spouse.image,
        }
      : undefined,
    children: childList,
    verified: depth <= 1,
  });

  if (node.spouse) {
    profiles.push({
      id: `${node.id}-spouse`,
      name: node.spouse.name,
      role: node.spouse.role,
      generation: gen,
      branch,
      quote: `${node.spouse.role} — phối ngẫu của ${node.name}.`,
      image: node.spouse.image,
      dob: node.spouse.dob,
      biography: [`${node.spouse.name} là ${node.spouse.role}.`],
      spouse: {
        id: node.id,
        name: node.name,
        role: node.role,
        dob: node.dob,
        image: node.image,
      },
      children: childList,
    });
  }

  node.children?.forEach((child, index) => {
    const childBranch = depth === 0 ? `Chi ${index + 1}` : branch;
    profiles.push(...flattenFallbackTree(child, depth + 1, childBranch));
  });

  return profiles;
}

export async function getMembersFromDb(): Promise<MemberProfile[]> {
  try {
    const rows = await prisma.familyMember.findMany();
    if (!rows.length) {
      if (allowDataFallback()) return flattenFallbackTree();
      return [];
    }
    const byId = new Map(rows.map((r) => [r.id, r as DbMember]));
    return rows
      .map((r) => toProfile(r as DbMember, byId))
      .sort((a, b) => a.generation.localeCompare(b.generation) || a.name.localeCompare(b.name));
  } catch {
    if (allowDataFallback()) return flattenFallbackTree();
    throw new Error("Database unavailable and data fallback is disabled.");
  }
}

export async function getMemberByIdFromDb(id: string): Promise<MemberProfile | undefined> {
  const all = await getMembersFromDb();
  return all.find((m) => m.id === id);
}

export async function getTreeFromDb(): Promise<TreeNodeData | null> {
  try {
    const rows = await prisma.familyMember.findMany();
    if (!rows.length) {
      return allowDataFallback() ? treeDataFallback : null;
    }
    const byId = new Map(rows.map((r) => [r.id, r as DbMember]));
    const tree = buildTreeFromDb(byId);
    if (tree) return tree;
    return allowDataFallback() ? treeDataFallback : null;
  } catch {
    if (allowDataFallback()) return treeDataFallback;
    throw new Error("Database unavailable and data fallback is disabled.");
  }
}

export async function getAllMemberIdsFromDb(): Promise<string[]> {
  try {
    const rows = await prisma.familyMember.findMany({ select: { id: true } });
    if (!rows.length) {
      return allowDataFallback() ? flattenFallbackTree().map((m) => m.id) : [];
    }
    return rows.map((r) => r.id);
  } catch {
    if (allowDataFallback()) return flattenFallbackTree().map((m) => m.id);
    throw new Error("Database unavailable and data fallback is disabled.");
  }
}

function inferGenderBucket(m: MemberProfile): "male" | "female" | "unknown" {
  const text = `${m.role} ${m.name}`.toLowerCase();
  if (
    /nữ|công nữ|phu nhân|thê|mẫu|bà |cô |chị |dâu|hoàng hậu|công chúa/.test(text)
  ) {
    return "female";
  }
  if (
    /nam|trưởng|tộc|cụ ông|ông |cậu |chú |con trai|hoàng tử|vương|công tử/.test(text)
  ) {
    return "male";
  }
  // Heuristic: many Vietnamese female given names end with common feminine markers in role
  if (m.id.endsWith("-spouse") && /phu|nữ|thê|mẫu/.test(text)) return "female";
  if (m.id.endsWith("-spouse")) return "female";
  return "unknown";
}

function parseAgeYears(m: MemberProfile, nowYear: number): number | null {
  const by = m.birthYear ? Number.parseInt(m.birthYear, 10) : NaN;
  if (!Number.isFinite(by) || by < 1000 || by > nowYear) return null;
  const dy = m.deathYear ? Number.parseInt(m.deathYear, 10) : NaN;
  if (Number.isFinite(dy) && dy >= by) return dy - by;
  return nowYear - by;
}

export type AnalyticsSummary = {
  totalMembers: number;
  catalogSize: number;
  generations: number;
  male: number;
  female: number;
  unknownGender: number;
  avgAge: number | null;
  cities: string[];
  byGeneration: { label: string; count: number }[];
  cityCounts: { city: string; count: number }[];
};

export async function getAnalyticsFromDb(): Promise<AnalyticsSummary> {
  const list = await getMembersFromDb();
  const gens = new Set(list.map((m) => m.generation));
  let male = 0;
  let female = 0;
  let unknownGender = 0;
  const ages: number[] = [];
  const nowYear = new Date().getFullYear();
  const genCounts = new Map<string, number>();
  const cityMap = new Map<string, number>();

  for (const m of list) {
    const g = inferGenderBucket(m);
    if (g === "male") male += 1;
    else if (g === "female") female += 1;
    else unknownGender += 1;

    const age = parseAgeYears(m, nowYear);
    if (age !== null) ages.push(age);

    genCounts.set(m.generation, (genCounts.get(m.generation) ?? 0) + 1);
    const city = (m.residence || "Chưa rõ").trim() || "Chưa rõ";
    cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
  }

  const byGeneration = [...genCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi"));

  const cityCounts = [...cityMap.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "vi"));

  const avgAge =
    ages.length > 0
      ? Math.round(ages.reduce((s, n) => s + n, 0) / ages.length)
      : null;

  return {
    totalMembers: list.length,
    catalogSize: list.length,
    generations: gens.size,
    male,
    female,
    unknownGender,
    avgAge,
    cities: cityCounts.slice(0, 5).map((c) => c.city),
    byGeneration,
    cityCounts,
  };
}

// Back-compat exports used by client pages / unit tests (static fallback only)
export const treeData = treeDataFallback;
export const members = flattenFallbackTree();
export function getMemberById(id: string) {
  return members.find((m) => m.id === id);
}
export function getAllMemberIds() {
  return members.map((m) => m.id);
}

/** Static demo summary for tests; live pages should use getAnalyticsFromDb(). */
export const analyticsSummary = {
  totalMembers: members.length,
  generations: new Set(members.map((m) => m.generation)).size,
  male: members.filter((m) => inferGenderBucket(m) === "male").length,
  female: members.filter((m) => inferGenderBucket(m) === "female").length,
  avgAge: (() => {
    const now = new Date().getFullYear();
    const ages = members
      .map((m) => parseAgeYears(m, now))
      .filter((n): n is number => n !== null);
    return ages.length
      ? Math.round(ages.reduce((s, n) => s + n, 0) / ages.length)
      : null;
  })(),
  cities: [
    ...new Set(members.map((m) => m.residence || "Chưa rõ").filter(Boolean)),
  ].slice(0, 5),
} as const;
