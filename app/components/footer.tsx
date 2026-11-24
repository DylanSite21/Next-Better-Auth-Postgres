import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { LOAN_DAYS } from "@/lib/utils";

type FooterLink = { href: string; label: string };

const exploreLinks: FooterLink[] = [
  { href: "/books", label: "Katalog buku" },
  { href: "/about", label: "Tentang kami" },
  { href: "/contact", label: "Hubungi admin" },
];

// Tautan akun menyesuaikan peran, sama seperti navbar
function getAccountLinks(role: "user" | "admin" | null): FooterLink[] {
  if (role === "admin") {
    return [
      { href: "/admin", label: "Panel admin" },
      { href: "/admin/transactions", label: "Verifikasi pembayaran" },
      { href: "/admin/loans", label: "Proses peminjaman" },
    ];
  }
  if (role === "user") {
    return [
      { href: "/cart", label: "Keranjang" },
      { href: "/transactions", label: "Pesanan saya" },
      { href: "/loans", label: "Peminjaman saya" },
    ];
  }
  return [
    { href: "/login", label: "Masuk" },
    { href: "/register", label: "Buat akun" },
  ];
}

const linkClass =
  "rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300";

function FooterNav({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: FooterLink[];
}) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="text-base font-semibold text-white">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function Footer() {
  const user = await getCurrentUser();

  return (
    <footer className="mt-6 bg-ink text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-5 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            Buku<span className="text-emerald-300">Ruang</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6">
            Toko buku dan perpustakaan dalam satu ruang. Beli untuk dimiliki,
            pinjam untuk dibaca.
          </p>
        </div>

        <FooterNav id="footer-explore" title="Jelajahi" links={exploreLinks} />
        <FooterNav
          id="footer-account"
          title="Akun"
          links={getAccountLinks(user?.role ?? null)}
        />

        <section aria-labelledby="footer-how">
          <h2 id="footer-how" className="text-base font-semibold text-white">
            Cara kerjanya
          </h2>
          <dl className="mt-4 space-y-3 text-sm leading-6">
            <div>
              <dt className="font-medium text-white">Membeli</dt>
              <dd>
                Bayar lewat transfer bank, unggah bukti, lalu tunggu verifikasi
                admin.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-white">Meminjam</dt>
              <dd>
                Ajukan peminjaman, dan setelah disetujui buku dipinjam selama{" "}
                {LOAN_DAYS} hari.
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm sm:px-5">
          &copy; {new Date().getFullYear()} BukuRuang.
        </p>
      </div>
    </footer>
  );
}
