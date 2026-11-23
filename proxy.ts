import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pengecekan cepat khusus endpoint API: tanpa cookie sesi -> 401 JSON.
// (/unauthorized bukan URL; halaman 401/403 ditampilkan lewat unauthorized()/forbidden()
// dari lib/dal.ts.) Validasi sesi dan role yang sebenarnya ada di lib/dal.ts.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/payment-proofs/:path*"],
};
