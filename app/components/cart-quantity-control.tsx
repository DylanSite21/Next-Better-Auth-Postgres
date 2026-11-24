"use client";

import { useState, useTransition } from "react";
import { updateCartItem } from "@/actions/cart";
import { useCart } from "@/app/components/cart-context";
import { MAX_CART_QUANTITY, MIN_CART_QUANTITY } from "@/lib/utils";

export function CartQuantityControl({
  itemId,
  title,
  initialQuantity,
  maxQuantity = MAX_CART_QUANTITY,
}: {
  itemId: string;
  title: string;
  initialQuantity: number;
  /** Batas atas tampilan (misalnya sesuai stok tersedia). Stok tetap dicek ulang saat checkout. */
  maxQuantity?: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();

  const { updateQuantity } = useCart();

  const updateItem = updateCartItem.bind(null, itemId);
  const limit = Math.max(
    MIN_CART_QUANTITY,
    Math.min(MAX_CART_QUANTITY, maxQuantity),
  );

  function handleQuantityChange(newQuantity: number) {
    const nextQuantity = Math.max(
      MIN_CART_QUANTITY,
      Math.min(limit, newQuantity),
    );

    if (nextQuantity === quantity) return;

    const previousQuantity = quantity;

    // Perbarui tampilan secara langsung
    setQuantity(nextQuantity);
    updateQuantity(itemId, nextQuantity);

    // Simpan perubahan ke database
    const formData = new FormData();
    formData.set("quantity", String(nextQuantity));

    startTransition(async () => {
      try {
        await updateItem(formData);
      } catch {
        // Gagal menyimpan: kembalikan ke jumlah sebelumnya
        setQuantity(previousQuantity);
        updateQuantity(itemId, previousQuantity);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <button
          type="button"
          className="btn-outline size-7 p-0"
          aria-label={`Tambah jumlah ${title}`}
          disabled={quantity >= limit || isPending}
          onClick={() => handleQuantityChange(quantity + 1)}
        >
          +
        </button>

        <button
          type="button"
          className="btn-outline size-7 p-0"
          aria-label={`Kurangi jumlah ${title}`}
          disabled={quantity <= MIN_CART_QUANTITY || isPending}
          onClick={() => handleQuantityChange(quantity - 1)}
        >
          -
        </button>
      </div>

      <input
        className="input w-16 text-center"
        type="number"
        value={quantity}
        readOnly
        aria-label={`Jumlah ${title}`}
      />
    </div>
  );
}
