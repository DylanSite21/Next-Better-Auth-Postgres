import { z } from "zod";

export const checkoutSchema = z.object({
  recipientName: z.string().trim().min(3, "Nama penerima minimal 3 karakter").max(255, "Nama penerima maksimal 255 karakter"),
  shippingAddress: z.string().trim().min(10, "Alamat lengkap minimal 10 karakter").max(1000, "Alamat maksimal 1.000 karakter"),
});