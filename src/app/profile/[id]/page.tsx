import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RemoteImage from "@/components/RemoteImage";
import {
  getAllMemberIdsFromDb,
  getMemberByIdFromDb,
} from "@/lib/family-data";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const ids = await getAllMemberIdsFromDb();
  return ids.map((id) => ({ id }));
}

export default async function ProfileByIdPage({ params }: Props) {
  const { id } = await params;
  const member = await getMemberByIdFromDb(id);
  if (!member) notFound();

  const spouseProfileId = member.spouse?.id ?? null;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen px-gutter max-w-container-max mx-auto pb-20">
        <nav className="py-6 text-sm font-label-md tracking-widest uppercase text-secondary/70">
          <Link href="/members" className="hover:text-secondary">
            Thành viên
          </Link>
          <span className="mx-2">/</span>
          <span className="text-secondary">{member.name}</span>
        </nav>

        <section className="flex flex-col items-center mb-section-gap relative">
          <div className="relative p-6 gold-border-double rounded-none bg-primary-container shadow-2xl mb-8 overflow-hidden">
            <div className="relative w-48 h-64 overflow-hidden border-2 border-secondary-fixed">
              <RemoteImage
                src={member.image}
                alt={`Chân dung ${member.name}`}
                width={192}
                height={256}
                className="w-full h-full object-cover grayscale brightness-110 contrast-125"
              />
            </div>
          </div>
          <div className="text-center z-10">
            <h1 className="font-display-lg text-secondary-fixed uppercase tracking-widest mb-2">
              {member.name}
            </h1>
            <p className="font-title-lg text-secondary-fixed-dim italic">
              {member.generation} • {member.branch}
            </p>
            <p className="mt-3 text-on-surface-variant font-label-sm uppercase tracking-widest">
              {member.role}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative">
          <div className="md:col-span-8 imperial-card p-unit gold-border-single relative overflow-hidden">
            <h2 className="font-headline-md text-secondary-fixed uppercase mb-6">Tiểu sử</h2>
            <div className="space-y-4 font-body-lg text-on-surface/90 leading-relaxed">
              {member.biography.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
              <p className="italic text-on-surface-variant">« {member.quote} »</p>
            </div>
          </div>

          <div className="md:col-span-4 imperial-card p-unit gold-border-single flex flex-col">
            <h2 className="font-headline-md text-secondary-fixed uppercase mb-6">Gia đình nhỏ</h2>
            {member.spouse ? (
              spouseProfileId ? (
                <Link href={`/profile/${spouseProfileId}`} className="block mb-6 group">
                  <p className="font-title-md text-secondary-fixed group-hover:underline">
                    {member.spouse.name}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">{member.spouse.role}</p>
                </Link>
              ) : (
                <p className="mb-6 text-secondary-fixed">{member.spouse.name}</p>
              )
            ) : (
              <p className="text-on-surface-variant italic text-sm mb-6">Chưa ghi nhận phối ngẫu.</p>
            )}

            <p className="text-label-sm text-secondary-fixed uppercase tracking-widest border-b border-secondary-fixed/10 pb-1 mb-3">
              Con cái
            </p>
            {member.children.length === 0 ? (
              <p className="text-on-surface-variant italic text-sm">Chưa ghi nhận.</p>
            ) : (
              <ul className="space-y-3">
                {member.children.map((child) => (
                  <li key={child.id ?? child.name}>
                    {child.id ? (
                      <Link href={`/profile/${child.id}`} className="hover:text-secondary">
                        {child.name}
                        {child.role ? ` (${child.role})` : ""}
                      </Link>
                    ) : (
                      child.name
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/tree"
              className="mt-8 btn-imperial-outline text-center py-3 text-xs tracking-widest uppercase"
            >
              Xem trên cây gia phả
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
