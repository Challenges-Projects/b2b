import { z } from "zod";

export const OrderItemSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().int().positive()
});

export const OrderCreateSchema = z.object({
  customer_id: z.number().int().positive(),
  items: z.array(OrderItemSchema).min(1)
});
export type OrderCreate = z.infer<typeof OrderCreateSchema>;


export const ProductCreateSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().min(1),
  stock: z.number().min(1),
  sku: z.string().min(3).max(20)

});

export const ProductUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  price: z.number().min(1).optional(),
  stock: z.number().min(1).optional(),
  sku: z.string().min(3).max(20).optional()

});
export type ProductCreate = z.infer<typeof ProductCreateSchema>;