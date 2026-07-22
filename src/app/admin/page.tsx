"use client";

import RemoteImage from "@/components/RemoteImage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

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

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "Thành viên",
    generation: "Đời thứ 14",
    branch: "Chi chính",
  });
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [decree, setDecree] = useState("");

  const load = useCallback(async () => {
    try {
      const [reqRes, auditRes] = await Promise.all([
        fetch("/api/admin/requests"),
        fetch("/api/admin/audit"),
      ]);
      if (reqRes.status === 401 || auditRes.status === 401) {
        router.push("/login?next=/admin");
        return;
      }
      const reqJson = (await reqRes.json()) as { ok?: boolean; items?: RequestItem[] };
      const auditJson = (await auditRes.json()) as { ok?: boolean; items?: AuditItem[] };
      if (reqJson.ok && reqJson.items) setRequests(reqJson.items);
      if (auditJson.ok && auditJson.items) setAudit(auditJson.items);
    } catch {
      setToast("Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial client fetch (session cookie). setState runs after await, not sync in effect body.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [reqRes, auditRes] = await Promise.all([
          fetch("/api/admin/requests"),
          fetch("/api/admin/audit"),
        ]);
        if (cancelled) return;
        if (reqRes.status === 401 || auditRes.status === 401) {
          router.push("/login?next=/admin");
          return;
        }
        const reqJson = (await reqRes.json()) as { ok?: boolean; items?: RequestItem[] };
        const auditJson = (await auditRes.json()) as { ok?: boolean; items?: AuditItem[] };
        if (cancelled) return;
        if (reqJson.ok && reqJson.items) setRequests(reqJson.items);
        if (auditJson.ok && auditJson.items) setAudit(auditJson.items);
      } catch {
        if (!cancelled) setToast("Không tải được dữ liệu quản trị.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);


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

  async function onAddMember(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberForm),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; item?: { id: string } };
    if (!res.ok || !data.ok) {
      setToast(data.error || "Không thêm được nhân khẩu.");
      return;
    }
    setToast(`Đã thêm thành viên (id: ${data.item?.id}).`);
    setShowMemberForm(false);
    setMemberForm({ name: "", role: "Thành viên", generation: "Đời thứ 14", branch: "Chi chính" });
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
                onClick={() => setShowMemberForm((v) => !v)}
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
            <form onSubmit={onAddMember} className="imperial-card p-8 grid md:grid-cols-2 gap-4">
              <h2 className="md:col-span-2 font-playfair text-xl gold-gradient-text">Thêm nhân khẩu mới</h2>
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
                    className="mt-1 w-full bg-black/30 border border-secondary/30 px-3 py-2 text-on-surface"
                    value={memberForm[key]}
                    onChange={(e) => setMemberForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="btn-imperial px-6 py-3">
                  Lưu vào CSDL
                </button>
                <button type="button" className="btn-imperial-outline px-6 py-3" onClick={() => setShowMemberForm(false)}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Sự vụ chờ duyệt</p>
              <h3 className="font-playfair text-5xl font-bold text-red-500 mt-2">{pendingCount}</h3>
            </div>
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Tổng sớ ký</p>
              <h3 className="font-playfair text-5xl font-bold gold-gradient-text mt-2">{requests.length}</h3>
            </div>
            <div className="imperial-card p-8">
              <p className="text-secondary/60 font-playfair uppercase tracking-[0.2em] text-xs">Nhật ký gần đây</p>
              <h3 className="font-playfair text-5xl font-bold gold-gradient-text mt-2">{audit.length}</h3>
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
