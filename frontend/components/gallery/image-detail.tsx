"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getClientToken, getCurrentUserId } from "@/lib/session-client";
import { CATEGORIES, type Category, type ImageItem } from "@/lib/types";

interface ImageDetailProps {
  id: string;
}

// B2-B5: fetched client-side because ownership and mutations both need the
// logged-in user's identity, which only exists in the browser. Shows
// title/category/upload date/click count, and — only when the current user
// owns the image — an edit form and a delete control with a confirm step.
// Seed images (userId: null) never match a real user id, so they're
// naturally read-only here too, same as the backend enforces (B5).
//
// Click count is *not* incremented here: that already happens where D1
// says the click itself occurs (GalleryGrid's onClick, before navigation).
// Incrementing again on load would double count a single click.
export function ImageDetail({ id }: ImageDetailProps) {
  const router = useRouter();
  const [image, setImage] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("nature");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ImageItem>(`/images/${id}`, { token: getClientToken() })
      .then((img) => {
        if (cancelled) return;
        setImage(img);
        setTitle(img.title);
        setCategory(img.category as Category);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setLoadError("Failed to load image.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>;

  if (notFound) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-500">Image not found.</p>
        <Link href="/gallery" className="text-sm underline">
          Back to gallery
        </Link>
      </div>
    );
  }

  if (loadError || !image) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{loadError ?? "Something went wrong."}</p>
    );
  }

  const isOwner = image.userId !== null && image.userId === getCurrentUserId();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (title.length < 3 || title.length > 80) {
      setSaveError("Title must be 3-80 characters.");
      return;
    }
    setSaving(true);
    try {
      const updated = await apiFetch<ImageItem>(`/images/${id}`, {
        method: "PATCH",
        token: getClientToken(),
        body: { title, category },
      });
      setImage(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await apiFetch(`/images/${id}`, { method: "DELETE", token: getClientToken() });
      router.push("/gallery");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete image.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/gallery" className="text-sm text-zinc-500 underline">
        Back to gallery
      </Link>

      {/* eslint-disable-next-line @next/next/no-img-element -- seed/MinIO hosts aren't configured for next/image */}
      <img
        src={image.imageUrl}
        alt={image.title}
        className="max-h-[480px] w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-800"
      />

      {editing ? (
        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setTitle(image.title);
                setCategory(image.category as Category);
                setSaveError(null);
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{image.title}</h1>
          <p className="text-sm text-zinc-500">
            {image.category} · uploaded {new Date(image.createdAt).toLocaleDateString()} ·{" "}
            {image.clickCount} click{image.clickCount === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {isOwner && !editing && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Edit
          </button>

          {confirmingDelete ? (
            <>
              <span className="text-sm text-zinc-500">Delete this image?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
    </div>
  );
}
