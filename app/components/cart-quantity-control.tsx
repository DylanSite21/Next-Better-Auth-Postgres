"use client";

import { useState, useTransition } from "react";
import { updateCartItem } from "@/actions/cart";
import { useCart } from "@/app/components/cart-context";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

export function CartQuantityControl({
  itemId,
  title,
  initialQuantity,
}: {
  itemId: string;
  title: string;
  initialQuantity: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();

  const { updateQuantity } = useCart();

  const updateItem = updateCartItem.bind(null, itemId);

  function handleQuantityChange(newQuantity: number) {
    const nextQuantity = Math.max(
      MIN_QUANTITY,
      Math.min(MAX_QUANTITY, newQuantity),
    );

    if (nextQuantity === quantity) return;

    // Update tampilan secara langsung
    setQuantity(nextQuantity);
    updateQuantity(itemId, nextQuantity);

    // Simpan perubahan ke database
    const formData = new FormData();
    formData.set("quantity", String(nextQuantity));

    startTransition(async () => {
      await updateItem(formData);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <button
          type="button"
          className="btn-outline size-7 p-0"
          aria-label={`Tambah jumlah ${title}`}
          disabled={quantity >= MAX_QUANTITY || isPending}
          onClick={() => handleQuantityChange(quantity + 1)}
        >
          +
        </button>

        <button
          type="button"
          className="btn-outline size-7 p-0"
          aria-label={`Kurangi jumlah ${title}`}
          disabled={quantity <= MIN_QUANTITY || isPending}
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
