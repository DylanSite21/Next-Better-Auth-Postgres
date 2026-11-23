import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { accounts, sessions, users, verifications } from "./db/schema";

// Opsi dasar dipisah dari lib/auth.ts supaya seed (di luar request Next.js)
// bisa memakai konfigurasi yang sama tanpa plugin nextCookies.
export const authOptions = {
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 6, maxPasswordLength: 128 },
  session: { expiresIn: 60 * 60 * 24 }, // 1 hari, sama seperti sebelumnya
  user: {
    additionalFields: {
      nik: { type: "string", required: false },
      address: { type: "string", required: false },
      // input:false -> tidak bisa diisi dari form/request pendaftaran
      role: { type: "string", defaultValue: "user", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  advanced: { database: { generateId: () => crypto.randomUUID() } },
} satisfies BetterAuthOptions;
