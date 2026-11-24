"use client";

import { useActionState } from "react";
import { checkout } from "@/actions/cart";
import { FormSubmit } from "@/app/components/form-submit";

export function CheckoutForm({
  defaultName = "",
  defaultAddress = "",
}: {
  defaultName?: string;
  defaultAddress?: string;
}) {
  const [state, action] = useActionState(checkout, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="recipientName" className="label">
          Nama penerima
        </label>
        <input
          id="recipientName"
          name="recipientName"
          type="text"
          autoComplete="name"
          className="input"
          minLength={3}
          maxLength={255}
          required
          // defaultValue={state.values?.recipientName ?? defaultName}
        />
      </div>
      <div>
        <label htmlFor="shippingAddress" className="label">
          Alamat lengkap
        </label>
        <textarea
          id="shippingAddress"
          name="shippingAddress"
          autoComplete="street-address"
          className="input"
          rows={4}
          minLength={10}
          maxLength={1000}
          required
          // defaultValue={state.values?.shippingAddress ?? defaultAddress}
          placeholder="Jl. Contoh Alamat No. 123, Kota Contoh, Provinsi Contoh, 12345"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <FormSubmit className="btn-primary w-full">Lanjutkan checkout</FormSubmit>
    </form>
  );
}
