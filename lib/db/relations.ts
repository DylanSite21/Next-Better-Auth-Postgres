import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(
  schema,
  (r) => ({
    users: {
      contactMessages: r.many.contactMessages({
        from: r.users.id,
        to: r.contactMessages.userId,
      }),
      cart: r.one.carts({
        from: r.users.id,
        to: r.carts.userId,
      }),
      loans: r.many.loans({
        from: r.users.id,
        to: r.loans.userId,
      }),
      transactions: r.many.transactions({
        from: r.users.id,
        to: r.transactions.userId,
      }),
      approvedLoans: r.many.loans({
        from: r.users.id,
        to: r.loans.approvedBy,
      }),
      verifiedTransactions: r.many.transactions({
        from: r.users.id,
        to: r.transactions.verifiedBy,
      }),
      stockMovements: r.many.stockMovements({
        from: r.users.id,
        to: r.stockMovements.userId,
      }),
    },
    contactMessages: {
      user: r.one.users({
        from: r.contactMessages.userId,
        to: r.users.id,
      }),
    },
    categories: {
      books: r.many.books({
        from: r.categories.id,
        to: r.books.categoryId,
      }),
    },
    books: {
      category: r.one.categories({
        from: r.books.categoryId,
        to: r.categories.id,
      }),
      stock: r.one.stocks({
        from: r.books.id,
        to: r.stocks.bookId,
      }),
      cartItems: r.many.cartItems({
        from: r.books.id,
        to: r.cartItems.bookId,
      }),
      loanItems: r.many.loanItems({
        from: r.books.id,
        to: r.loanItems.bookId,
      }),
      transactionItems: r.many.transactionItems({
        from: r.books.id,
        to: r.transactionItems.bookId,
      }),
      stockMovements: r.many.stockMovements({
        from: r.books.id,
        to: r.stockMovements.bookId,
      }),
    },
    stocks: {
      book: r.one.books({
        from: r.stocks.bookId,
        to: r.books.id,
      }),
    },
    carts: {
      user: r.one.users({
        from: r.carts.userId,
        to: r.users.id,
      }),
      items: r.many.cartItems({
        from: r.carts.id,
        to: r.cartItems.cartId,
      }),
    },
    cartItems: {
      cart: r.one.carts({
        from: r.cartItems.cartId,
        to: r.carts.id,
      }),
      book: r.one.books({
        from: r.cartItems.bookId,
        to: r.books.id,
      }),
    },
    loans: {
      user: r.one.users({
        from: r.loans.userId,
        to: r.users.id,
      }),
      approver: r.one.users({
        from: r.loans.approvedBy,
        to: r.users.id,
      }),
      items: r.many.loanItems({
        from: r.loans.id,
        to: r.loanItems.loanId,
      }),
    },
    loanItems: {
      loan: r.one.loans({
        from: r.loanItems.loanId,
        to: r.loans.id,
      }),
      book: r.one.books({
        from: r.loanItems.bookId,
        to: r.books.id,
      }),
    },
    transactions: {
      user: r.one.users({
        from: r.transactions.userId,
        to: r.users.id,
      }),
      verifier: r.one.users({
        from: r.transactions.verifiedBy,
        to: r.users.id,
      }),
      items: r.many.transactionItems({
        from: r.transactions.id,
        to: r.transactionItems.transactionId,
      }),
    },
    transactionItems: {
      transaction: r.one.transactions({
        from: r.transactionItems.transactionId,
        to: r.transactions.id,
      }),
      book: r.one.books({
        from: r.transactionItems.bookId,
        to: r.books.id,
      }),
    },
    stockMovements: {
      book: r.one.books({
        from: r.stockMovements.bookId,
        to: r.books.id,
      }),
      user: r.one.users({
        from: r.stockMovements.userId,
        to: r.users.id,
      }),
    },
  }),
);
