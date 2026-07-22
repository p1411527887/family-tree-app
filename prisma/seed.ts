import { PrismaClient, Role, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveSeedAdminCredentials } from "../src/lib/seed-admin";

const prisma = new PrismaClient();

type TreePerson = {
  name: string;
  role: string;
  dob?: string;
  image: string;
};

type TreeNode = {
  id: string;
  name: string;
  role: string;
  dob?: string;
  image: string;
  spouse?: TreePerson;
  children?: TreeNode[];
};

function genLabel(depth: number): string {
  return `Đời thứ ${depth + 1}`;
}

function splitDob(dob?: string) {
  if (!dob) return { birthYear: undefined as string | undefined, deathYear: undefined as string | undefined };
  const parts = dob.split("-").map((s) => s.trim());
  return { birthYear: parts[0], deathYear: parts[1] };
}

async function upsertMember(data: {
  id: string;
  name: string;
  role: string;
  generation: string;
  branch: string;
  quote: string;
  image: string;
  dob?: string;
  parentId?: string | null;
  spouseId?: string | null;
  verified?: boolean;
  sortOrder?: number;
  biography?: string[];
}) {
  const { birthYear, deathYear } = splitDob(data.dob);
  await prisma.familyMember.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      name: data.name,
      role: data.role,
      generation: data.generation,
      branch: data.branch,
      quote: data.quote,
      image: data.image,
      dob: data.dob,
      birthYear,
      deathYear,
      residence: "Việt Nam",
      biography: JSON.stringify(
        data.biography ?? [
          `${data.name} (${data.role}) là thành viên quan trọng trong cây gia phả.`,
          "Tiểu sử chi tiết do Ban Quản trị cập nhật khi có sử liệu xác thực.",
        ]
      ),
      verified: data.verified ?? false,
      parentId: data.parentId ?? null,
      spouseId: data.spouseId ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    update: {
      name: data.name,
      role: data.role,
      generation: data.generation,
      branch: data.branch,
      quote: data.quote,
      image: data.image,
      dob: data.dob,
      birthYear,
      deathYear,
      parentId: data.parentId ?? null,
      spouseId: data.spouseId ?? null,
      verified: data.verified ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

async function walkTree(
  node: TreeNode,
  depth: number,
  branch: string,
  parentId: string | null,
  sortOrder: number
) {
  const gen = genLabel(depth);
  const spouseId = node.spouse ? `${node.id}-spouse` : null;

  await upsertMember({
    id: node.id,
    name: node.name,
    role: node.role,
    generation: gen,
    branch,
    quote: `${node.role} của dòng họ — ${node.dob ?? "niên đại đang cập nhật"}.`,
    image: node.image,
    dob: node.dob,
    parentId,
    spouseId,
    verified: depth <= 1,
    sortOrder,
  });

  if (node.spouse && spouseId) {
    await upsertMember({
      id: spouseId,
      name: node.spouse.name,
      role: node.spouse.role,
      generation: gen,
      branch,
      quote: `${node.spouse.role} — phối ngẫu của ${node.name}.`,
      image: node.spouse.image,
      dob: node.spouse.dob,
      parentId: null,
      spouseId: node.id,
      verified: depth <= 1,
      sortOrder: sortOrder + 1,
    });
  }

  if (node.children?.length) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]!;
      const childBranch = depth === 0 ? `Chi ${i + 1}` : branch;
      await walkTree(child, depth + 1, childBranch, node.id, (i + 1) * 10);
    }
  }
}

async function main() {
  const { username, password } = resolveSeedAdminCredentials();

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { username },
    create: { username, passwordHash, role: Role.admin },
    update: { passwordHash, role: Role.admin },
  });
  console.log(`Seeded admin user: ${username}`);

  const dataPath = join(process.cwd(), "src/data.json");
  const raw = JSON.parse(readFileSync(dataPath, "utf8")) as { treeData: TreeNode };
  await walkTree(raw.treeData, 0, "Chi chính", null, 0);
  console.log("Seeded family tree from data.json");

  const showcase = [
    {
      id: "showcase-1",
      name: "Nguyễn Phúc Vĩnh Thụy",
      role: "Trưởng tộc",
      generation: "Đời thứ 12",
      branch: "Chi Cánh Tả",
      quote: "Trưởng tộc đời thứ 12, người nắm giữ chìa khóa của kho lưu trữ dòng họ...",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC0WgKnDVDXODgDOHz34qPAaYtjor2e034Vk7mehChjgP0dbI_PiwdLlVmWnymHSnp5IVZwsOhg4_ACoG1VerBbLa85LNtZRq2BZm0KeldxWFsh014g5yFD6KguRbAuJCCH5HiC-KaLfgJQsuqy0Ya5sH9R980Owpc1l8HLBIg50_lTpNHGlqaKAJg2xQp52rvLINWyO5DfKU6Z4gAsjzeceQ4CSCannjoey2jjiIeMrLmLEjNfxj-Jp6IPyM9eSQAi0Zlun9WVy0o",
      birthYear: "1940",
      residence: "Huế",
      verified: true,
    },
    {
      id: "showcase-2",
      name: "Công Nữ Huyền Trân",
      role: "Nghi lễ gia tộc",
      generation: "Đời thứ 13",
      branch: "Chi Cánh Hữu",
      quote: "Chuyên gia phục dựng các nghi lễ gia tộc và trang phục cổ truyền...",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAB4aJWWz51zUcbIeuUL9KagFfrRiiO7CxiTNlYEUQaern3GoaV-M7Ou6wN8FmvzPUtaM5m1Lf5UYWYuG-uXb08UPB0orfE6M4YLaDTyJCBlhwt2tFrtJ--c7aXUcJ7Ox_EG6R3m8sYbrDDftYt7EOGoXo2EkGv4knk5SMIvosHE6NDDex4G14aCvHi6DUoeW5qy8dwPRjvtSuMLlhBlASmCnWc4YlhhuSG0-qhUawGD2D10ZPG2ux1p9r2TTYQdPdSMwWZr77WnRQ",
      birthYear: "1965",
      residence: "Hà Nội",
    },
    {
      id: "showcase-3",
      name: "Tôn Thất Minh Khôi",
      role: "Số hóa gia phả",
      generation: "Đời thứ 14",
      branch: "Hậu Duệ Trực Hệ",
      quote: "Người số hóa gia phả, kết nối các thế hệ thông qua công nghệ hiện đại...",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDesEFLxHbgvGPvMhwXonpl0unKDPqec0SMAk2zTuQKIb_ey2Yn3ROVqBykkaamGCE-CkXS4fvtlOjc91gkwotaXyMfFakbEPLJWiRQqvsWmFQZk8nBDK0fDCoSuP4oCSAP_i8si7SgBg-F-zm7AcWuWGNVjhtHIvayzAafRha96RO5F3tVV_ywV09MIynFpjQgqG7toFgoxCWudLxqJZZMecDezUAWIDqwe0r7Yom1VGZGom36uqEYBjeUSabaL2-HhPhjmCwdQXE",
      birthYear: "1990",
      residence: "TP. Hồ Chí Minh",
    },
    {
      id: "showcase-4",
      name: "Nguyễn Phúc Bảo Ân",
      role: "Sứ giả văn hóa",
      generation: "Đời thứ 12",
      branch: "Chi Tiền Vệ",
      quote: "Sứ giả văn hóa, đại diện gia đình trong các cuộc hội thảo quốc tế...",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBHuPXulW88ITd9XROYTFQRvkB-ulNOcxmPoZug4RZPbW-rZGpoetjcZiu3wNH38YAlwgABo6x5VHf2s17aeEGQOxVczOcnVeSy28xNly7AQ9JyIqz2VvKpgSzkGle0Ggk6BFP8-WdkeKMGHCnTAZfwKQOyrZWH58ITL9wQoasJF49iWs7u7YldonSJuHaq-_C59SBJuYBjEIskAHdIFg_IDf6YKZZFJoZW6tAD77q9L1saI-hpGDNnyys8FV9ojL89H1508DiGZls",
      birthYear: "1955",
      residence: "Hải Phòng",
    },
  ];

  for (const s of showcase) {
    await prisma.familyMember.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        role: s.role,
        generation: s.generation,
        branch: s.branch,
        quote: s.quote,
        image: s.image,
        birthYear: s.birthYear,
        residence: s.residence,
        biography: JSON.stringify([s.quote]),
        verified: Boolean(s.verified),
        sortOrder: 1000,
      },
      update: {
        name: s.name,
        role: s.role,
        quote: s.quote,
        image: s.image,
        verified: Boolean(s.verified),
      },
    });
  }

  const requestCount = await prisma.adminRequest.count();
  if (requestCount === 0) {
    await prisma.adminRequest.createMany({
      data: [
        {
          name: "Nguyễn Văn A",
          branch: "Hậu duệ Chi 3",
          detail: "Đã bổ sung điển tích: Lễ rước bằng khen năm 1992",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCgFlk4Y5wbbyeqfl2fIpzs3jxk9CJ1O3l0VrI0hvE1F__8nVyeXJZwFK45aCFGMwwNIlSzjhVLqMsGbyqMnTeOHUJwnWr2OvJ-oTn0ybJyO0cD3t8c7nbbGQ5cdokgtt9jB826blg_gNS_qKhqGnLR6E7wSvTpbt9zUE5wtqYMUWvvk3hwHl_X90eI93-iuJQbT4WdIx2b9BbffGf5fXNOI1_tye0rlzxJMne1I-UxDgNWKtBMZnJsspdXjM92whMa7Og9qfljFvg",
          status: RequestStatus.pending,
        },
        {
          name: "Trần Thị B",
          branch: "Dâu trưởng Chi 1",
          detail: "Thỉnh nguyện cập nhật nhật kỳ sinh cho tôn tử",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBZEyw_zSSeQnJNs4f1T2irsAZLy3etPUBLBwP1eZPl_crNGg57FmmT4D6amFfcwmYDqcaQQO5vDd4xLMlgwO06-VxypHFEJT8OHWQzAoxfQpG3B9v69fgQpLITRK1IAzhlZL_nfE3hyoc_bHkgMEfYVIDx4TdiCtZFuXa1v7OS2a1drK8dDC6tlwpSeEkgDObDgrmH_xhe9PnrU0nSWgSnUjFdVpnnaThH2aZlACmJVO6U4_maiaXH0ljW5SJuXC5f25Xcz8ZBq0I",
          status: RequestStatus.pending,
        },
      ],
    });
  }

  const newsCount = await prisma.newsArticle.count();
  if (newsCount === 0) {
    await prisma.newsArticle.createMany({
      data: [
        {
          slug: "dai-hoi-xuan-giap-thin",
          title: "Đại Hội Thường Niên Xuân Giáp Thìn Tại Từ Đường",
          category: "Cáo Thị Họp Họ",
          excerpt:
            "Trân trọng kính mời liệt vị tôn túc và toàn thể con cháu về tề tựu tại Nhà thờ tổ để cùng đàm đạo việc tu bổ từ đường và kế hoạch chấn hưng dòng tộc.",
          body: "Ban Quản trị kính cáo toàn thể tộc thuộc: Đại hội thường niên sẽ diễn ra tại Từ đường. Chương trình gồm dâng hương, báo cáo công đức, và bàn việc khuyến học cho thế hệ trẻ.",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuB7Y9HDG7-VTEwVaVV47hBRbCOzlG9DK7HcjXhzYgaz7zDuyZ-iXarrZhtGDDP-PRlPzb7kGJXv8Lq9Kh0HlIL3Bzgpzs8QwqyxIjuhGzzC-0mVbP6RkKA6L5PXfaCV9lispcINBpyXNNKaiAyLMnQ7vqI5BYb8dJP5evcPgzJPeS2PJJhWe_m4qA9XlWCDsmrqwykiBnUfCC5OhTMB9ATdZcfv1Y0LNa_uvXqkHD55qrkDR0vK5kh7mKPx499JqqgsesEhuiO0KgQ",
        },
        {
          slug: "bang-vang-khoa-cu",
          title: "Vinh Danh Hiền Tài Đạt Thành Tích Khoa Cử Xuất Sắc",
          category: "Bảng Vàng Danh Dự",
          excerpt:
            "Dòng họ hoan hỉ thông báo danh sách những người con ưu tú đã có tên trên bảng vàng các kỳ thi vừa qua.",
          body: "Danh sách bảng vàng được công bố sau khi Ban Khuyến Học thẩm định hồ sơ. Mỗi thành viên được vinh danh sẽ nhận bằng khen và học bổng theo quy định tộc ước.",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDDy_Ua2eU6cO9eqbx528NO9GL2BDAjZD9ARX80rrztQ5Cezx2hEArhHcpryL7wgJWnxwd19aOZ5-E_-3ck4pF4DB3hjE_tU2U4To0nzAskkZ5o1oTsW0tX8GOIxTs-Fw56Hea69Xb7AvpkVbTekKvUA6-76nUquTPRlfNohW41KDptcYsw5Ddq-xXB-WjkAZiPU8MyPp1QYGL4DdCjNp7DTXDTyPC4FgfkQu7OrojMJWDdwFPG6aKJN0aAXWYJ2RxGvmhRWMBrMVg",
        },
      ],
    });
  }

  const eventCount = await prisma.familyEvent.count();
  if (eventCount === 0) {
    await prisma.familyEvent.createMany({
      data: [
        {
          slug: "gio-to-2024",
          title: "Sự Kiện Lớn Giỗ Tổ Họ Nguyễn",
          era: "Giáp Thìn (2024)",
          yearLabel: "Tiết Tháng Tư, Niên hiệu 2024",
          category: "Sự Kiện Lớn Giỗ Tổ",
          body: "Ngày đại gia đình hội ngộ, dâng hương và tri ân công đức tổ tiên tại Từ đường dòng họ.",
          cta: "Xem Toàn Văn Bằng Khen",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuA3EYqjzLIzbwYZczQ2fa9txL0QJF5_bMq9-upmQINiiBmV63oNgB6ETSDiU9K5Gihy-G9LeScWTTZW7mOi_6nawssbFbtq7B9SBcq62h9pWxTYqFB8r7fKmduq-YYOcguc_A05_gc2FtQLHykUKPQB_SqCYSVDssNeWEmOshgdX9jLUSsdMOboehCbdyq0lvJ-mRjJ8stNSLnuAMrYvSvX8vPyrLKhESD09LtOg03naIn6cAkrt1DNv2HQJf8ukfBXMooMUy4Ja-Q",
          imageAlt: "Lễ giỗ tổ tại từ đường",
          sortOrder: 1,
        },
        {
          slug: "khanh-tho-2024",
          title: "Khánh Thọ Cụ Tiên Cửu Tuần",
          era: "Giáp Thìn (2024)",
          yearLabel: "Tiết Tháng Hai, Niên hiệu 2024",
          category: "Khánh Thọ",
          body: "Chúc mừng đại thọ Cụ Tiên tròn 90 tuổi. Con cháu khắp phương trời sum vầy.",
          cta: "Ghi Chép Kỷ Niệm",
          image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCpUmo9TwAhhjbHAnvWs2BXr5K35hVw_-0tgiCmlrhloCtKOOeMhHVpUcGSmWu9e1jvB6bmEqR5SCHdXwtNvTm3DqioCl35TdhF9vghAPPLdB3cOiBBrs8kq9J62bHImKVyO9YMQmyq9MTDzUHaW5jNVIBsmfmu1MW5HQmjIJ-RlXf8eUut42o00l1jRPMxosNpRXLMLdmd3FDo9uS15RBii9VXYrweE_TVV36xjSXRbq0uSa_vOguZcEsZC9l9lwJkSHCEhNQbTIY",
          imageAlt: "Lễ mừng thọ 90 tuổi",
          reverse: true,
          sortOrder: 2,
        },
      ],
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "seed.run",
      entity: "system",
      meta: JSON.stringify({ at: new Date().toISOString() }),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
