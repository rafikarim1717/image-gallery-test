"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getClientToken } from "@/lib/session-client";
import { CATEGORIES, type Category, type ImageItem } from "@/lib/types";

const MAX_FILE_BYTES = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// B1: upload form (file, title, category). Validation mirrors the
// backend's exactly — same limits, same wording — so a rejected file never
// makes a round trip, but the backend re-checks everything regardless
// (validation must run on both ends per the brief; client-side alone is
// bypassable).
export default function UploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("nature");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validateFile(f: File | null): string | null {
    if (!f) return "Choose a file to upload.";
    if (!ALLOWED_TYPES.includes(f.type)) {
      return "Invalid file type: only jpeg, png, or webp are allowed";
    }
    if (f.size > MAX_FILE_BYTES) {
      return `File too large: ${(f.size / (1024 * 1024)).toFixed(2)}MB exceeds the 1MB limit`;
    }
    return null;
  }

  function validateTitle(t: string): string | null {
    if (t.length < 3 || t.length > 80) return "Title must be 3-80 characters";
    return null;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileError(validateFile(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const fErr = validateFile(file);
    const tErr = validateTitle(title);
    setFileError(fErr);
    setTitleError(tErr);
    if (fErr || tErr) return;

    const body = new FormData();
    body.append("file", file!);
    body.append("title", title);
    body.append("category", category);

    setSubmitting(true);
    try {
      const created = await apiFetch<ImageItem>("/images/upload", {
        method: "POST",
        token: getClientToken(),
        body,
      });
      router.push(`/images/${created.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Upload failed. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Upload image</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="file" className="text-sm font-medium">
              File
            </label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900"
            />
            <p className="text-xs text-zinc-500">JPEG, PNG, or WebP, under 1MB.</p>
            {fileError && <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(validateTitle(e.target.value));
              }}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            {titleError && <p className="text-sm text-red-600 dark:text-red-400">{titleError}</p>}
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

          {submitError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {submitError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {submitting ? "Uploading..." : "Upload"}
            </button>
            <Link href="/gallery" className="text-sm text-zinc-500 underline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
