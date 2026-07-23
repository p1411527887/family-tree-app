"use client";

import RemoteImage from "@/components/RemoteImage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

type MemberItem = {
  id: string;
  name: string;
  role: string;
  generation: string;
  branch: string;
  parentId: string | null;
};

type RequestItem = {
  id: string;
  name: string;
  branch: string;
  detail: string;
  image: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  reviewedAt?: string | null;
};

type AuditItem = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  createdAt: string;
  actor?: { username: string } | null;
};

const emptyMemberForm = {
  id: "",
  name: "",
  role: "Thành viên",
  generation: "Đời thứ 14",
  branch: "Chi chính",
  parentId: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [decree, setDecree] = useState("");

  const load = useCallback(async () => {
    try {
      const [memberRes, reqRes, auditRes] = await Promise.all([
        fetch("/api/admin/members"),
        fetch("/api/admin/requests"),
        fetch("/api/admin/audit"),
      ]);
      if ([memberRes, reqRes, auditRes].some((res) => res.status === 401)) {
        router.push("/login?next=/admin");
        return;
      }
      const memberJson = (await memberRes.json()) as { ok?: boolean; items?: MemberItem[] };
      const reqJson = (await reqRes.json()) as { ok?: boolean; items?: RequestItem[] };
      const auditJson = (await auditRes.json()) as { ok?: boolean; items?: AuditItem[] };
      if (memberJson.ok && memberJson.items) setMembers(memberJson.items);
      if (reqJson.ok && reqJson.items) setRequests(reqJson.items);
      if (auditJson.ok && auditJson.items) setAudit(auditJson.items);
    } catch {
      setToast("Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);


  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function setStatus(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Không cập nhật được thỉnh nguyện.");
      return;
    }
    setToast(status === "approved" ? "Đã chuẩn tấu (lưu máy chủ)." : "Đã bác bỏ (lưu máy chủ).");
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function onSaveMember(e: FormEvent) {
    e.preventDefault();
    const editing = Boolean(memberForm.id);
    const res = await fetch("/api/admin/members", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberForm),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; item?: { id: string } };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Không lưu được nhân khẩu.");
      return;
    }
    setToast(editing ? "Đã cập nhật nhân khẩu." : `Đã thêm thành viên (id: ${data.item?.id}).`);
    setShowMemberForm(false);
    setMemberForm(emptyMemberForm);
    await load();
  }

  function editMember(member: MemberItem) {
    setMemberForm({ ...member, parentId: member.parentId ?? "" });
    setShowMemberForm(true);
    document.getElementById("member-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function deleteMember(member: MemberItem) {
    if (!window.confirm(`Xóa ${member.name} khỏi gia phả?`)) return;
    const res = await fetch(`/api/admin/members?id=${encodeURIComponent(member.id)}`, { method: "DELETE" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Không xóa được nhân khẩu.");
      return;
    }
    setToast(`Đã xóa ${member.name}.`);
    await load();
  }

  async function onDecree() {
    if (!decree.trim()) {
      setToast("Nhập nội dung chiếu chỉ trước khi ban hành.");
      return;
    }
    const res = await fetch("/api/admin/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ban Quản trị",
        branch: "Chiếu chỉ",
        detail: decree.trim(),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Không ban hành được.");
      return;
    }
    setToast("Đã ghi chiếu chỉ vào sớ ký máy chủ.");
    setDecree("");
    await load();
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen">
        <div className="h-20 bg-background/80 backdrop-blur-lg border-b-2 border-secondary/20 flex items-center justify-between px-6 md:px-12 sticky top-24 z-40">
          <div className="flex items-center gap-3">
            <span className="text-secondary/40 uppercase tracking-widest text-[11px] font-bold hidden sm:inline">
              Bàn Thờ Tổ Tiên
            </span>
            <span className="material-symbols-outlined text-sm text-secondary/40 hidden sm:inline" aria-hidden>
              arrow_forward_ios
            </span>
            <span className="font-playfair text-lg font-bold gold-gradient-text tracking-widest uppercase italic">
              Tổng quan
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" className="relative group" aria-label="Thông báo" onClick={() => setToast(`Còn ${pendingCount} sự vụ chờ duyệt.`)}>
              <span className="material-symbols-outlined text-2xl group-hover:text-white transition-colors text-secondary" aria-hidden>
                notifications
              </span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full shadow-[0_0_8px_#FFD700]" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-[10px] uppercase tracking-widest text-secondary/70 hover:text-secondary border border-secondary/40 px-3 py-2"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b-2 border-secondary/10 pb-8">
            <div className="space-y-2">
              <h1 className="font-playfair text-5xl md:text-6xl font-bold gold-gradient-text tracking-tighter italic">
                Tổng Quan
              </h1>
              <p className="font-body text-secondary/80 max-w-xl text-lg italic">
                Dữ liệu quản trị lưu trên máy chủ (PostgreSQL/Prisma). Mọi duyệt/bác và thêm nhân khẩu đều có audit log.

              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="btn-imperial px-8 py-4 flex items-center gap-3"
                onClick={() => {
                  setMemberForm(emptyMemberForm);
                  setShowMemberForm(true);
                }}
              >
                <span className="material-symbols-outlined !text-primary" aria-hidden>
                  person_add
                </span>
                Thêm Nhân Khẩu
              </button>
              <button
                type="button"
                className="btn-imperial-outline px-8 py-4 flex items-center gap-3"
                onClick={() => {
                  const el = document.getElementById("decree-box");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="material-symbols-outlined text-inherit" aria-hidden>
                  campaign
                </span>
                Ban Chiếu Chỉ
              </button>
            </div>
          </div>

          {showMemberForm && (
            <form id="member-form" onSubmit={onSaveMember} className="imperial-card p-8 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 font-playfair text-xl gold-gradient-text">
                {memberForm.id ? "Chỉnh sửa nhân khẩu" : "Thêm nhân khẩu mới"}
              </h2>
              {(
                [
                  ["name", "Họ tên"],
                  ["role", "Vai trò"],
                  ["generation", "Đời"],
                  ["branch", "Chi nhánh"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm text-secondary/80">
                  {label}
                  <input
                    required={key === "name"}
                    className="mt-1 min-h-11 w-full bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface focus:border-secondary focus:outline-none"
                    value={memberForm[key]}
                    onChange={(e) => setMemberForm((form) => ({ ...form, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="block text-sm text-secondary/80 md:col-span-2">
                Cha hoặc mẹ
                <select
                  className="mt-1 min-h-11 w-full bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface focus:border-secondary focus:outline-none"
                  value={memberForm.parentId}
                  onChange={(e) => setMemberForm((form) => ({ ...form, parentId: e.target.value }))}
                >
                  <option value="">Chưa xác định</option>
                  {members.filter((member) => member.id !== memberForm.id).map((member) => (
                    <option key={member.id} value={member.id}>{member.name} · {member.generation}</option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button type="submit" className="btn-imperial px-6 py-3">
                  {memberForm.id ? "Lưu thay đổi" : "Thêm vào gia phả"}
                </button>
                <button
                  type="button"
                  className="btn-imperial-outline px-6 py-3"
                  onClick={() => {
                    setShowMemberForm(false);
                    setMemberForm(emptyMemberForm);
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          <section className="imperial-card overflow-hidden" aria-labelledby="member-list-title">
            <div className="p-6 border-b border-secondary/20 flex flex-wrap items-center justify-between gap-3 bg-primary/20">
              <div>
                <h2 id="member-list-title" className="font-playfair text-2xl font-bold gold-gradient-text">Nhân khẩu trong gia phả</h2>
                <p className="mt-1 text-sm text-secondary/60">{members.length} thành viên · chọn một người để chỉnh sửa hoặc xóa.</p>
              </div>
              <button type="button" className="btn-imperial-outline min-h-11 px-5" onClick={() => void load()}>
                Tải lại
              </button>
            </div>
            <div className="divide-y divide-secondary/10 md:hidden">
              {members.map((member) => (
                <article key={member.id} className="p-5 space-y-4">
                  <div>
                    <h3 className="font-playfair text-lg font-bold text-secondary">{member.name}</h3>
                    <p className="mt-1 text-sm text-on-surface/65">{member.generation} · {member.branch}</p>
                    <p className="mt-1 text-sm text-on-surface/65">{member.role}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="btn-imperial-outline min-h-11 px-4 text-sm" onClick={() => editMember(member)}>
                      Sửa
                    </button>
                    <button type="button" className="min-h-11 border border-red-400/60 px-4 text-sm text-red-300 hover:bg-red-950/30" onClick={() => void deleteMember(member)}>
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
              {!loading && members.length === 0 && (
                <p className="px-6 py-8 text-center italic text-secondary/60">Chưa có nhân khẩu.</p>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-black/30 border-b border-secondary/10 text-xs uppercase tracking-widest text-secondary/60">
                    <th className="px-6 py-4">Họ tên</th>
                    <th className="px-6 py-4">Đời · Chi</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-secondary/5">
                      <td className="px-6 py-4 font-playfair font-bold text-secondary">{member.name}</td>
                      <td className="px-6 py-4 text-sm text-on-surface/70">{member.generation} · {member.branch}</td>
                      <td className="px-6 py-4 text-sm text-on-surface/70">{member.role}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button type="button" className="min-h-11 px-4 text-sm text-secondary hover:underline" onClick={() => editMember(member)}>
                          Sửa
                        </button>
                        <button type="button" className="min-h-11 px-4 text-sm text-red-400 hover:text-red-300" onClick={() => void deleteMember(member)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && members.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center italic text-secondary/60">Chưa có nhân khẩu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Tổng nhân khẩu</p>
              <p className="font-playfair text-5xl font-bold gold-gradient-text mt-2">{members.length}</p>
            </div>
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Sự vụ chờ duyệt</p>
              <p className="font-playfair text-5xl font-bold text-red-500 mt-2">{pendingCount}</p>
            </div>
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Nhật ký gần đây</p>
              <p className="font-playfair text-5xl font-bold gold-gradient-text mt-2">{audit.length}</p>
            </div>
          </div>

          <div id="decree-box" className="imperial-card p-8 space-y-4">
            <h2 className="font-playfair text-2xl gold-gradient-text">Ban Chiếu Chỉ</h2>
            <textarea
              className="w-full min-h-28 bg-black/30 border border-secondary/30 p-4 text-on-surface"
              placeholder="Nội dung chiếu chỉ / thông báo nội tộc..."
              value={decree}
              onChange={(e) => setDecree(e.target.value)}
            />
            <button type="button" className="btn-imperial px-8 py-3" onClick={onDecree}>
              Ghi vào sớ ký
            </button>
          </div>

          <div className="imperial-card overflow-hidden">
            <div className="p-8 border-b border-secondary/20 flex justify-between items-center bg-primary/20">
              <h2 className="font-playfair text-2xl font-bold gold-gradient-text uppercase tracking-widest italic">
                Sớ ký hoạt động
              </h2>
              <button
                type="button"
                className="text-secondary text-sm uppercase tracking-widest font-bold border-b border-secondary"
                onClick={() => void load()}
              >
                Tải lại toàn bộ sớ
              </button>
            </div>
            {loading ? (
              <p className="p-8 text-secondary/60 italic">Đang tải từ máy chủ...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/30 border-b border-secondary/10">
                      <th className="px-8 py-5 font-playfair text-xs uppercase tracking-[0.2em] text-secondary/40">
                        Nhân vật
                      </th>
                      <th className="px-8 py-5 font-playfair text-xs uppercase tracking-[0.2em] text-secondary/40">
                        Sự trạng
                      </th>
                      <th className="px-8 py-5 font-playfair text-xs uppercase tracking-[0.2em] text-secondary/40 text-right">
                        Phân định
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary/5">
                    {requests.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border border-secondary p-0.5 overflow-hidden">
                              {item.image ? (
                                <RemoteImage
                                  alt={`Chân dung ${item.name}`}
                                  className="w-full h-full object-cover"
                                  src={item.image}
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div className="w-full h-full bg-primary/40" />
                              )}
                            </div>
                            <div>
                              <p className="font-playfair font-bold text-secondary">{item.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-secondary/40">{item.branch}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <p className="font-body text-secondary/80 italic">{item.detail}</p>
                        </td>
                        <td className="px-8 py-8 text-right space-x-3">
                          {item.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                className="px-4 py-1.5 border border-secondary text-[10px] uppercase font-bold text-secondary hover:bg-secondary hover:text-primary"
                                onClick={() => void setStatus(item.id, "approved")}
                              >
                                Chuẩn tấu
                              </button>
                              <button
                                type="button"
                                className="px-4 py-1.5 border border-red-900 text-[10px] uppercase font-bold text-red-500 hover:bg-red-900"
                                onClick={() => void setStatus(item.id, "rejected")}
                              >
                                Bác bỏ
                              </button>
                            </>
                          ) : (
                            <span
                              className={`text-[10px] uppercase tracking-widest font-bold ${
                                item.status === "approved" ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {item.status === "approved" ? "Đã chuẩn tấu" : "Đã bác bỏ"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="imperial-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-playfair text-2xl gold-gradient-text">Audit log</h2>
              <Link href="/analytics" className="text-secondary text-sm uppercase tracking-widest border-b border-secondary">
                Mở thống kê
              </Link>
            </div>
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {audit.map((a) => (
                <li key={a.id} className="text-sm text-on-surface/70 border-b border-secondary/10 pb-2">
                  <span className="text-secondary">{a.actor?.username ?? "hệ thống"}</span>
                  {" · "}
                  <code className="text-secondary/80">{a.action}</code>
                  {a.entityId ? ` · ${a.entityId}` : ""}
                  <span className="block text-[10px] text-on-surface/40">
                    {new Date(a.createdAt).toLocaleString("vi-VN")}
                  </span>
                </li>
              ))}
              {!audit.length && <li className="italic text-secondary/50">Chưa có nhật ký.</li>}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
