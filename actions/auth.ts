"use server";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { FormState } from "@/lib/types";

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    nik: String(formData.get("nik") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data registrasi tidak valid." };
  }

  const { name, email, nik, address, password } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "Email sudah terdaftar." };
  const [existingNik] = await db.select({ id: users.id }).from(users).where(eq(users.nik, nik)).limit(1);
  if (existingNik) return { error: "NIK sudah terdaftar." };

  try {
    // hash password, buat user + sesi + cookie ditangani Better Auth
    await auth.api.signUpEmail({ body: { name, email, password, nik, address }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: error.message || "Pendaftaran gagal." };
    throw error;
  }
  redirect("/");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data login tidak valid." };
  }

  // akun nonaktif tidak boleh masuk (pesan disamakan agar tidak membocorkan status akun)
  const [account] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (account && !account.isActive) return { error: "Email atau kata sandi salah." };

  let role: string | undefined;
  try {
    const result = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    role = (result.user as { role?: string }).role;
  } catch (error) {
    if (error instanceof APIError) return { error: "Email atau kata sandi salah." };
    throw error;
  }
  redirect(role === "admin" ? "/admin" : "/");
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
