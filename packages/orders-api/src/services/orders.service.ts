import { pool } from "../utils/db.js";
import axios from "axios";
import * as repo from "../repositories/orders.repo.js";

const CUSTOMERS_API_BASE = process.env.CUSTOMERS_API_BASE;
const SERVICE_TOKEN = process.env.SERVICE_TOKEN!;

const validateCustomer = async (customerId: number) => {
  try {
    const customer = await axios.get(
      `${CUSTOMERS_API_BASE}/internal/customers/${customerId}`,
      {
        headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
      }
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const createOrder = async (input: {
  customer_id: number;
  items: { product_id: number; qty: number }[];
}) => {
  const isValidCustomer = await validateCustomer(input.customer_id);
  if (!isValidCustomer) {
    throw Object.assign(new Error("Customer not found"), { status: 404 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ids = input.items.map((i) => i.product_id);
    const rows = await repo.getProductsByIds(ids, conn);
    const products = new Map(rows.map((p: any) => [p.id, p]));

    let total = 0;
    for (const item of input.items) {
      const p = products.get(item.product_id);
      if (!p)
        throw Object.assign(new Error("Product not found"), { status: 400 });
      if (p.stock < item.qty)
        throw Object.assign(new Error("Insufficient stock"), { status: 400 });
      total += p.price_cents * item.qty;
    }
    const orderId = await repo.insertOrder(input.customer_id, total, conn);
    for (const item of input.items) {
      const p = products.get(item.product_id)!;
      await repo.insertItem(
        orderId,
        item.product_id,
        item.qty,
        p.price_cents,
        conn
      );
      await repo.decreaseStock(item.product_id, item.qty, conn);
    }
    await conn.commit();
    return { id: orderId, status: "CREATED", total_cents: total };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const confirmOrder = async (orderId: number, idempotencyKey: string) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Respuesta cacheada
    const cached = await repo.getIdempotentResponse(idempotencyKey, conn);
    if (cached) {
      console.log(`respuesta cacheada: ${cached}`)
      await conn.commit();

      return cached;
    }

    // Registrar PENDING si no esta cacheada

    await repo.saveIdempotencyPending(idempotencyKey, orderId, conn);

    const ord = await repo.getOrderStatus(orderId, conn);
    if (!ord)
      throw Object.assign(new Error("Orden No encontrasa"), { status: 404 });
    
    if (ord.status === "CREATED") {
      await repo.setOrderStatus(orderId, "CONFIRMED", conn);
    } else if (ord.status !== "CONFIRMED") {
      throw Object.assign(new Error("Status invalido"), { status: 400 });
    }

    const payload = await repo.buildOrderResponse(orderId, conn);
    console.log(`Payload : ${payload}`)
    await repo.setIdempotentResponse(idempotencyKey, payload, conn);
    await conn.commit();
    return payload;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

export const getOrderById = async (id: number) => {
  const rows = await repo.findOrderWithItems(id);

  if (rows.length === 0) {
    const err = Object.assign(new Error("Orden No encontrada"), {
      status: 404,
    });
    throw err;
  }

  const order = {
    id: rows[0].order_id,
    customer_id: rows[0].customer_id,
    status: rows[0].status,
    total: rows[0].total_cents / 100,
    created_at: rows[0].created_at,
    items: rows.map((r) => ({
      product_id: r.product_id,
      name: r.product_name,
      quantity: r.qty,
      unit_price: r.unit_price_cents / 100,
      subtotal: (r.unit_price_cents * r.qty) / 100,
    })),
  };

  return order;
};


export const cancelOrderService=async (orderId: number) =>{
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Traer la orden
    const [orders]: any = await conn.execute(
      "SELECT id, status, total_cents, created_at FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );

    if (orders.length === 0) {
      throw Object.assign(new Error("Orden no encontrada"), { status: 404 });
    }

    const order = orders[0];

    if (order.status === "CANCELED") {
      throw Object.assign(new Error("Orden ya cancelada"), { status: 409 });
    }

    // 2️⃣ Reglas de cancelación
    const now = new Date(); // 2025-10-30T23:15:42.000Z
    const createdAt = new Date(order.created_at + "Z")
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;
    console.log(`diferencia entre minutos ${diffMinutes} y status ${order.status}`)
    if (diffMinutes > 10) {
      console.log(`${diffMinutes} es mayor que 10`)
    }
    if (order.status === "CONFIRMED" && diffMinutes > 10) {
      throw Object.assign(
        new Error("Orden confirmada no puede ser cancelada despues de 10 minutos"),
        { status: 400 }
      );
    }
    //Por seguridad evitamos que cualquier status distinto de CREATED Y CONFIRMED
    if (!["CREATED", "CONFIRMED"].includes(order.status)) {
      throw Object.assign(new Error("Status invalido para cancelacion"), {
        status: 400,
      });
    }

    // 3️⃣ Restaurar stock
    const [items]: any = await conn.execute(
      "SELECT product_id, qty FROM order_items WHERE order_id = ?",
      [orderId]
    );

    for (const item of items) {
      await conn.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.qty, item.product_id]
      );
    }

    // 4️⃣ Actualizar orden a CANCELED
    await conn.execute(
      "UPDATE orders SET status = 'CANCELED' WHERE id = ?",
      [orderId]
    );

    await conn.commit();

    return {
      message: "Orden canceleda existosamente",
      order_id: orderId,
      restored_items: items.length,
      restored_stock: items.map((i:any) => ({
        product_id: i.product_id,
        qty: i.qty,
      })),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
