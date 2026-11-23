import "dotenv/config";
import { pool } from "./index";

// Menghapus SELURUH tabel dan tipe enum (schema public). Jalankan lalu `db:push` + `db:seed`.
async function resetDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Reset database tidak boleh dijalankan di production.");
  }
  console.log("Menghapus seluruh tabel...");
  await pool.query("DROP SCHEMA public CASCADE");
  await pool.query("CREATE SCHEMA public");
  console.log("Database berhasil di-reset.");
}

resetDatabase()
  .catch((error) => {
    console.error("Reset database gagal:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
