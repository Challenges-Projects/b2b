import { z } from "zod";

export const ItemSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().int().positive()
});

export const OrchestratorInputSchema = z.object({
  customer_id: z.number().int().positive(),
  items: z.array(ItemSchema).min(1),
  idempotency_key: z.string().min(3),
  correlation_id: z.string().min(3).optional()
});
export type OrchestratorCreateType = z.infer<typeof OrchestratorInputSchema>;


