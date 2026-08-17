"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "../theme/theme-toggle";
import { clearClientToken } from "@/lib/session-client";

// A7: a logout control that ends the session.
export function Navbar() {
  const router = useRouter();

  function handleLogout() {
    clearClientToken();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
      <Link href="/gallery" className="font-semibold">
        Image Gallery
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/upload" className="text-sm underline">
          Upload
        </Link>
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
