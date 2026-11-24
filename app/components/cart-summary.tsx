"use client";

import { CheckoutForm } from "@/app/components/checkout-form";
import { useCart } from "@/app/components/cart-context";
import { formatCurrency } from "@/lib/utils";

export function CartSummary() {
  const { total } = useCart();

  return (
    <aside className="h-fit space-y-5 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
      <h2 className="text-xl font-bold">Ringkasan pesanan</h2>

      <div className="flex justify-between border-t border-line pt-4 text-lg font-bold">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <p className="text-xs leading-5 text-muted">
        Stok akan diperiksa kembali saat pembayaran dikonfirmasi oleh admin.
      </p>

      <CheckoutForm />
    </aside>
  );
}
