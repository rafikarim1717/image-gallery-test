import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/session.server";

export default async function RootPage() {
  const token = await getServerToken();
  redirect(token ? "/gallery" : "/login");
}
