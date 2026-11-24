// Data rekening tujuan transfer. Isi lewat .env agar mudah diganti tanpa mengubah kode.
export const bankAccount = {
  bank: "BCA",
  number: process.env.BANK_ACCOUNT_NUMBER ?? "0000000000",
  holder: process.env.BANK_ACCOUNT_HOLDER ?? "BukuRuang",
};

export const gopayAccount = {
  number: process.env.GOPAY_ACCOUNT_NUMBER ?? "0000000000",
  holder: process.env.GOPAY_ACCOUNT_HOLDER ?? "BukuRuang",
};