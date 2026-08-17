import { ImageDetail } from "@/components/gallery/image-detail";

// B2-B5: this server component only resolves the dynamic segment.
// ImageDetail (client) owns fetching, the ownership check, and the
// edit/delete UI, since all three depend on the logged-in user's identity.
export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <ImageDetail id={id} />
    </div>
  );
}
