import { desc, eq, or, like, and, inArray } from "drizzle-orm";
import { ActionFeedback } from "@/app/components/action-feedback";
import { verifyTransaction } from "@/actions/transactions";
import { db } from "@/lib/db";
import { transactionItems, transactions, users } from "@/lib/db/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

type TransactionStatus = (typeof transactions.status.enumValues)[number];

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const search = q?.trim() ?? "";

  const allowedStatuses: TransactionStatus[] = [
    "pending",
    "awaiting_verification",
    "paid",
    "rejected",
    "cancelled",
    "refunded",
  ];

  const selectedStatus: TransactionStatus | undefined = allowedStatuses.find(
    (value) => value === status,
  );

  const rows = await db
    .select({ transaction: transactions, user: users })
    .from(transactions)
    .innerJoin(users, eq(users.id, transactions.userId))
    .where(
      and(
        search
          ? or(
              like(users.name, `%${search}%`),
              like(users.email, `%${search}%`),
              like(transactions.invoiceNumber, `%${search}%`),
            )
          : undefined,

        selectedStatus ? eq(transactions.status, selectedStatus) : undefined,
      ),
    )
    .orderBy(desc(transactions.createdAt));
  ``;
  const items = rows.length
    ? await db
        .select({
          transactionId: transactionItems.transactionId,
          bookTitle: transactionItems.bookTitle,
          quantity: transactionItems.quantity,
        })
        .from(transactionItems)
        .where(
          inArray(
            transactionItems.transactionId,
            rows.map(({ transaction }) => transaction.id),
          ),
        )
    : [];
  const itemsByTransaction = new Map<
    string,
    { bookTitle: string; quantity: number }[]
  >();
  for (const item of items) {
    const transactionItemsForRow =
      itemsByTransaction.get(item.transactionId) ?? [];
    transactionItemsForRow.push(item);
    itemsByTransaction.set(item.transactionId, transactionItemsForRow);
  }
  const pending = rows.filter(
    ({ transaction }) => transaction.status === "awaiting_verification",
  );
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Keuangan
        </p>
        <h1 className="mt-2 text-4xl font-bold">Transaksi</h1>
      </div>
      {/* Search */}
      <form
        method="GET"
        className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Cari nama, email, atau invoice..."
          className="input w-full min-w-0"
        />

        <select
          name="status"
          defaultValue={selectedStatus ?? ""}
          className="input w-full min-w-0"
        >
          <option value="">Semua status</option>
          <option value="awaiting_verification">Menunggu verifikasi</option>
          <option value="paid">Lunas</option>
          <option value="rejected">Ditolak</option>
        </select>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Cari
          </button>

          {(search || selectedStatus) && (
            <Link
              href="/admin/transactions"
              className="bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent rounded"
            >
              Reset
            </Link>
          )}
        </div>
      </form>
      {rows.map(({ transaction, user }) => (
        <article
          key={transaction.id}
          className="space-y-4 rounded-xl border border-line bg-white p-5"
        >
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-xs text-muted">
                {transaction.invoiceNumber} ·{" "}
                {formatDate(transaction.createdAt)}
              </p>
              <h2 className="mt-1 text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {formatCurrency(transaction.totalAmount)}
              </p>
              <p className="mt-1 text-sm text-muted">{transaction.status}</p>
            </div>
          </div>
          <div className="border-t border-line pt-3">
            <p className="text-sm font-semibold">Buku dibeli</p>
            <ul className="mt-1 space-y-1 text-sm text-muted">
              {(itemsByTransaction.get(transaction.id) ?? []).map((item) => (
                <li key={`${transaction.id}-${item.bookTitle}`}>
                  {item.bookTitle} × {item.quantity}
                </li>
              ))}
            </ul>
          </div>
          {transaction.paymentProof && (
            <a
              className="font-semibold text-brand underline"
              href={`/api/payment-proofs/${encodeURIComponent(transaction.paymentProof)}`}
              target="_blank"
              rel="noreferrer"
            >
              Buka bukti pembayaran
            </a>
          )}
          {transaction.rejectionReason && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {transaction.rejectionReason}
            </p>
          )}
          {transaction.status === "awaiting_verification" && (
            <div className="flex flex-wrap gap-4">
              <ActionFeedback
                action={verifyTransaction.bind(null, transaction.id)}
                submitLabel="Setujui pembayaran"
              >
                <input type="hidden" name="decision" value="paid" />
                <p className="text-sm text-muted">
                  Stok dikurangi secara atomik jika pembayaran disetujui.
                </p>
              </ActionFeedback>
              <ActionFeedback
                action={verifyTransaction.bind(null, transaction.id)}
                submitLabel="Tolak pembayaran"
              >
                <input type="hidden" name="decision" value="rejected" />
                <label className="block">
                  <span className="label">Alasan penolakan</span>
                  <input
                    className="input"
                    name="reason"
                    maxLength={1000}
                    required
                  />
                </label>
              </ActionFeedback>
            </div>
          )}
        </article>
      ))}
      {!rows.length && (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-muted">
          Belum ada transaksi.
        </p>
      )}
      <p className="text-xs text-muted">
        {pending.length} pembayaran menunggu verifikasi.
      </p>
    </div>
  );
}
