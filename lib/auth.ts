import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { authOptions } from "./auth-config";

export const auth = betterAuth({
  ...authOptions,
  plugins: [nextCookies()], // wajib agar cookie ter-set dari Server Action
});
