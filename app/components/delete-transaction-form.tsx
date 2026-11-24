"use client";

import { useActionState } from "react";
import { deleteTransaction } from "@/actions/transactions";
import { FormSubmit } from "@/app/components/form-submit";

export function DeleteTransactionForm({
  transactionId,
}: {
  transactionId: string;
}) {
  const [state, action] = useActionState(
    deleteTransaction.bind(null, transactionId),
    {},
  );

  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.")) {
          event.preventDefault();
        }
      }}
    >
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <FormSubmit className="btn-danger">Hapus transaksi</FormSubmit>
    </form>
  );
}
