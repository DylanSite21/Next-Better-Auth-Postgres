import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const u = session.user;
  // akun yang dinonaktifkan dianggap tidak login
  // (sesi juga dihapus saat dinonaktifkan, lihat toggleUserStatus)
  if (!u.isActive) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "admin" ? "admin" : "user",
    isActive: u.isActive,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) unauthorized(); // -> app/unauthorized.tsx (401)
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") forbidden(); // -> app/forbidden.tsx (403)
  return user;
}
