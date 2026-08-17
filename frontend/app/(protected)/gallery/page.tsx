import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/session.server";
import { apiFetch } from "@/lib/api";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import type { ImageListResponse } from "@/lib/types";

const PAGE_SIZE = 16;

// C1/C2: Server Component — fetches the first page of images (the seeded
// dataset alone is >=16 rows) using the session cookie, so the grid is
// already in the initial HTML instead of a client-side loading flash.
// GalleryGrid (client) takes over from there for infinite scroll, filter,
// sort, and click handling (C3-C7).
export default async function GalleryPage() {
  const token = await getServerToken();
  if (!token) redirect("/login"); // defense in depth; proxy.ts already guards this route

  const { images, total } = await apiFetch<ImageListResponse>(
    `/images?skip=0&take=${PAGE_SIZE}`,
    { token },
  );

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Gallery</h1>
      <GalleryGrid initialImages={images} initialTotal={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
