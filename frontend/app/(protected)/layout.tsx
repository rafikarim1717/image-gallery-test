import { Navbar } from "@/components/nav/navbar";

// Shared shell for every route behind login (gallery, upload, image detail).
// The "(protected)" segment is a route group — it organizes these routes
// under one layout without adding a path segment, so /gallery stays /gallery.
// Actual access control is proxy.ts (cookie presence) plus every backend
// call requiring a valid token — this layout only renders the chrome.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
