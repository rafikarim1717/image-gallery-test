"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getClientToken } from "@/lib/session-client";
import { CATEGORIES, type Category, type ImageItem, type ImageListResponse } from "@/lib/types";

type SortOption = "newest" | "title" | "clicks";
type CategoryFilter = Category | "all";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  title: "Title (A-Z)",
  clicks: "Most clicked",
};

interface GalleryGridProps {
  initialImages: ImageItem[];
  initialTotal: number;
  pageSize: number;
}

// C3-C7: everything the server component can't do statically — infinite
// scroll, category filter, sort, and click handling (increments the
// backend's counter before the user lands on the detail page; the detail
// page itself only displays clickCount, it doesn't increment it again).
export function GalleryGrid({ initialImages, initialTotal, pageSize }: GalleryGridProps) {
  const [images, setImages] = useState(initialImages);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  const hasMore = images.length < total;

  const buildQuery = useCallback(
    (skip: number) => {
      const params = new URLSearchParams({ skip: String(skip), take: String(pageSize) });
      if (category !== "all") params.set("category", category);
      if (sort !== "newest") params.set("sort", sort);
      return params.toString();
    },
    [category, pageSize, sort],
  );

  // Category/sort changed: refetch from the top instead of patching the
  // existing list — skip/take pagination doesn't compose with a filter
  // change mid-scroll. Skipped on mount since the server component already
  // fetched that exact page.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    let cancelled = false;
    setLoadingFilters(true);
    setError(null);
    apiFetch<ImageListResponse>(`/images?${buildQuery(0)}`, { token: getClientToken() })
      .then((res) => {
        if (cancelled) return;
        setImages(res.images);
        setTotal(res.total);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load images.");
      })
      .finally(() => {
        if (!cancelled) setLoadingFilters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buildQuery, category, sort]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loadingFilters || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await apiFetch<ImageListResponse>(`/images?${buildQuery(images.length)}`, {
        token: getClientToken(),
      });
      setImages((prev) => [...prev, ...res.images]);
      setTotal(res.total);
    } catch {
      setError("Failed to load more images.");
    } finally {
      setLoadingMore(false);
    }
  }, [buildQuery, hasMore, images.length, loadingFilters, loadingMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function handleImageClick(id: string) {
    // Fire-and-forget: don't block navigation on the click-count write.
    apiFetch(`/images/${id}/click`, { method: "POST", token: getClientToken() }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>

        <span className="text-sm text-zinc-500">
          {total} image{total === 1 ? "" : "s"}
        </span>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loadingFilters ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-zinc-500">No images found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <Link
              key={image.id}
              href={`/images/${image.id}`}
              onClick={() => handleImageClick(image.id)}
              className="group overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element -- seed/MinIO hosts aren't configured for next/image */}
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-medium">{image.title}</p>
                <p className="text-xs text-zinc-500">
                  {image.category} · {image.clickCount} click{image.clickCount === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-sm text-zinc-500">{loadingMore ? "Loading more..." : ""}</span>
        </div>
      )}
    </div>
  );
}
