import { Request, Response } from "express";
import { OrderCreateSchema } from "../schemas/orders.schema.js";
import * as svc from "../services/orders.service.js";
import { createToken } from "../middlewares/auth.middleware.js";

export const createOrder = async (req: Request, res: Response) => {
  const parsed = OrderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Error de validación",
      errors: parsed.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const data = parsed.data;
  try {
    const order = await svc.createOrder(data);
    res.status(201).json(order);
  } catch (err: any) {
    // 4️⃣ Manejo de errores controlados
    console.log(err);
    if (err.status && err.message) {
      return res.status(err.status).json({ error: err.message });
    }

    // 5️⃣ Manejo de errores inesperados
    console.error("❌ Error interno al crear orden:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await svc.getOrderById(id);
    res.json(order);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("❌ Error al obtener orden:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const confirmOrder = async (req: Request, res: Response) => {
  const key = req.header("X-Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Missing X-Idempotency-Key" });
  const orderId = Number(req.params.id);
  if (Number.isNaN(orderId))
    return res.status(400).json({ error: "Id Invalido" });
  try {
    const result = await svc.confirmOrder(orderId, key);
    return res.json(result);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("❌ Error al obtener orden:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const result = await svc.cancelOrderService(id);
    return res.status(200).json(result);

  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("❌ Error al cancelar orden:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getToken = (req: Request, res: Response) => {
  try {
    return res.status(200).json({ token: createToken() });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      ok: false,
      message: "No se pudo generar token",
    });
  }
};
