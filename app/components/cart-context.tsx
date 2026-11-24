"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartItem = {
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

  function updateQuantity(id: string, quantity: number) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
