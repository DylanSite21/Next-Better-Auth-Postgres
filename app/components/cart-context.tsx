"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  quantity: number;
  price: number;
};

type CartContextType = {
  items: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  initialItems,
  children,
}: {
  initialItems: CartItem[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(initialItems);

  // Sinkronkan dengan server saat daftar item berubah (misalnya setelah item dihapus).
  // Perubahan jumlah tidak ikut disinkronkan di sini karena sudah diperbarui langsung
  // lewat updateQuantity, jadi tampilan tidak berkedip dan fokus keyboard tidak hilang.
  const serverIds = initialItems.map((item) => item.id).join(",");
  const [syncedIds, setSyncedIds] = useState(serverIds);
  if (serverIds !== syncedIds) {
    setSyncedIds(serverIds);
    setItems(initialItems);
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  // Dihitung dalam satuan sen agar tidak ada selisih pecahan desimal
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
        0,
      ) / 100,
    [items],
  );

  return (
    <CartContext.Provider value={{ items, updateQuantity, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
