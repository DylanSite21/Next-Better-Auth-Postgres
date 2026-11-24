import Link from "next/link";
import { eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PaymentProofForm } from "@/app/components/payment-proof-form";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { transactionItems, transactions } from "@/lib/db/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { bankAccount, gopayAccount } from "@/lib/payment";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  pending: "Menunggu pembayaran",
  awaiting_verification: "Menunggu verifikasi admin",
  paid: "Pembayaran berhasil",
  rejected: "Pembayaran ditolak",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(or(eq(transactions.id, id), eq(transactions.invoiceNumber, id)))
    .limit(1);
  if (!transaction || (user.role !== "admin" && transaction.userId !== user.id))
    notFound();
  const items = await db
    .select()
    .from(transactionItems)
    .where(eq(transactionItems.transactionId, transaction.id));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/transactions"
        className="inline-flex text-sm font-semibold text-brand"
      >
        ← Kembali ke pesanan
      </Link>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted">Invoice</p>
            <h1 className="mt-1 break-all text-xl font-extrabold tracking-tight sm:text-2xl">
              {transaction.invoiceNumber}
            </h1>
          </div>
          <span className="h-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-brand">
            {labels[transaction.status] ?? transaction.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Dibuat {formatDate(transaction.createdAt)}
        </p>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap justify-between gap-3 py-4"
            >
              <div>
                <p className="font-semibold">{item.bookTitle}</p>
                <p className="text-sm text-muted">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <p className="font-semibold sm:text-right">
                {formatCurrency(item.subtotal)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </p>
        {transaction.rejectionReason && (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Alasan: {transaction.rejectionReason}
          </p>
        )}
      </section>

      {(transaction.recipientName || transaction.shippingAddress) && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold">Penerima</h2>
          <p className="mt-3 font-semibold">{transaction.recipientName}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">
            {transaction.shippingAddress}
          </p>
        </section>
      )}

      {transaction.paymentProof && (
        <a
          className="btn-outline w-full sm:w-auto"
          href={`/api/payment-proofs/${encodeURIComponent(transaction.paymentProof)}`}
          target="_blank"
          rel="noreferrer"
        >
          Lihat bukti pembayaran
        </a>
      )}
      {user.role === "user" &&
        ["pending", "rejected"].includes(transaction.status) && (
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold">Cara pembayaran</h2>
            <p className="mt-2 text-sm text-muted">
              Transfer sesuai total pesanan ke rekening {bankAccount.bank}{" "}
              berikut, lalu unggah bukti transfer di bawah. Admin akan
              memverifikasi pembayaran Anda.
            </p>
            <dl className="mt-4 grid gap-3 rounded-xl bg-emerald-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Bank</dt>
                <dd className="mt-1 font-semibold">{bankAccount.bank}</dd>
              </div>
              <div>
                <dt className="text-muted">Nomor rekening</dt>
                <dd className="mt-1 select-all font-mono text-base font-bold tracking-wide">
                  {bankAccount.number}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Atas nama</dt>
                <dd className="mt-1 font-semibold">{bankAccount.holder}</dd>
              </div>

              <div>
                <dt className="text-muted">Gopay</dt>
                <dd className="mt-1 font-semibold">{gopayAccount.number}</dd>
              </div>
              <div>
                <dt className="text-muted">Nomor Gopay</dt>
                <dd className="mt-1 select-all font-mono text-base font-bold tracking-wide">
                  {gopayAccount.number}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Atas nama</dt>
                <dd className="mt-1 font-semibold">{gopayAccount.holder}</dd>
              </div>
            </dl>
            <p className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
              <span className="text-muted">Jumlah yang harus ditransfer</span>
              <span className="text-base font-bold">
                {formatCurrency(transaction.totalAmount)}
              </span>
            </p>
            {/* <p className="mt-2 text-sm text-muted">
              Cantumkan nomor invoice{" "}
              <span className="break-all font-medium text-ink">
                {transaction.invoiceNumber}
              </span>{" "}
              pada berita transfer agar pembayaran mudah dicocokkan.
            </p> */}
          </section>
        )}
      {user.role === "user" &&
        ["pending", "rejected"].includes(transaction.status) && (
          <PaymentProofForm transactionId={transaction.id} />
        )}
    </div>
  );
}
