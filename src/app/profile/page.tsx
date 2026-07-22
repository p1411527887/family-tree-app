import { redirect } from "next/navigation";
import { members } from "@/lib/family-data";

/** Legacy /profile → first directory member (or tree root). */
export default function ProfileIndexPage() {
  const fallback = members[0]?.id ?? "root";
  redirect(`/profile/${fallback}`);
}
