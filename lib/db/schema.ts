import {
  pgTable,
  pgEnum,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. ENUM
// ==========================================
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const bookStatusEnum = pgEnum("book_status", ["draft", "published", "archived"]);
export const loanStatusEnum = pgEnum("loan_status", [
  "pending",
  "approved",
  "rejected",
  "borrowed",
  "returned",
  "overdue",
  "cancelled",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["bank_transfer", "cash"]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "awaiting_verification",
  "paid",
  "rejected",
  "cancelled",
  "refunded",
]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "initial",
  "restock",
  "purchase",
  "loan_reserved",
  "loan_issued",
  "loan_returned",
  "loan_released",
  "adjustment",
]);
export const contactMessageStatusEnum = pgEnum("contact_message_status", ["unread", "read"]);

const uuidPk = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// ==========================================
// 2. TABEL AUTH (dikelola Better Auth)
// ==========================================
// Nama properti (name, email, emailVerified, ...) harus sama dengan field Better Auth.
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(), // diisi Better Auth (UUID)
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // --- field tambahan milik aplikasi (didaftarkan di lib/auth-config.ts) ---
  nik: varchar("nik", { length: 16 }).unique(),
  address: text("address"),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  password: text("password"), // hash password (credential)
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const verifications = pgTable("verifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// ==========================================
// 3. TABEL APLIKASI
// ==========================================
export const contactMessages = pgTable("contact_messages", {
  id: uuidPk(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: contactMessageStatusEnum("status").default("unread").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const categories = pgTable("categories", {
  id: uuidPk(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
});

export const books = pgTable("books", {
  id: uuidPk(),
  categoryId: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isbn: varchar("isbn", { length: 20 }).unique(),
  author: varchar("author", { length: 255 }).notNull(),
  publisher: varchar("publisher", { length: 255 }).notNull(),
  publicationYear: integer("publication_year").notNull(),
  description: text("description"),
  image: varchar("image", { length: 500 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  addressAuthor: varchar("address_author", { length: 255 }),
  status: bookStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const stocks = pgTable("stocks", {
  id: uuidPk(),
  bookId: varchar("book_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => books.id, { onDelete: "restrict" }),
  totalQuantity: integer("total_quantity").default(0).notNull(),
  availableQuantity: integer("available_quantity").default(0).notNull(),
  reservedQuantity: integer("reserved_quantity").default(0).notNull(),
  borrowedQuantity: integer("borrowed_quantity").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const carts = pgTable("carts", {
  id: uuidPk(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuidPk(),
    cartId: varchar("cart_id", { length: 36 })
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    bookId: varchar("book_id", { length: 36 })
      .notNull()
      .references(() => books.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("cart_book_unique").on(table.cartId, table.bookId)],
);

export const loans = pgTable("loans", {
  id: uuidPk(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  loanNumber: varchar("loan_number", { length: 100 }).notNull().unique(),
  status: loanStatusEnum("status").default("pending").notNull(),
  loanDate: timestamp("loan_date"),
  dueDate: timestamp("due_date"),
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  borrowedAt: timestamp("borrowed_at"),
  returnedAt: timestamp("returned_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const loanItems = pgTable("loan_items", {
  id: uuidPk(),
  loanId: varchar("loan_id", { length: 36 })
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  bookId: varchar("book_id", { length: 36 })
    .notNull()
    .references(() => books.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
});

export const transactions = pgTable("transactions", {
  id: uuidPk(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("bank_transfer").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  paymentProof: varchar("payment_proof", { length: 500 }),
  verifiedBy: varchar("verified_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  paidAt: timestamp("paid_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const transactionItems = pgTable("transaction_items", {
  id: uuidPk(),
  transactionId: varchar("transaction_id", { length: 36 })
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  bookId: varchar("book_id", { length: 36 })
    .notNull()
    .references(() => books.id, { onDelete: "restrict" }),
  bookTitle: varchar("book_title", { length: 255 }).notNull(), // snapshot
  price: numeric("price", { precision: 12, scale: 2 }).notNull(), // snapshot
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuidPk(),
  bookId: varchar("book_id", { length: 36 })
    .notNull()
    .references(() => books.id, { onDelete: "restrict" }),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  type: stockMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  beforeQuantity: integer("before_quantity").notNull(),
  afterQuantity: integer("after_quantity").notNull(),
  referenceNumber: varchar("reference_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
