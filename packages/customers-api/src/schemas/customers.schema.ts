import { z } from "zod";

export const CustomerCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(3).max(60).optional()
});
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
