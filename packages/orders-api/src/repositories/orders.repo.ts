import { pool } from "../utils/db.js";

export const getProductsByIds = async (ids: number[], conn?: any) => {
  const c = conn ?? pool;
  const [rows] = await c.query(
    "SELECT id, price_cents, stock FROM products WHERE id IN (?)",
    [ids]
  );
  return rows as any[];
};

export const insertOrder = async (
  customerId: number,
  total: number,
  conn: any
) => {
  const [res]: any = await conn.query(
    "INSERT INTO orders (customer_id, status, total_cents) VALUES (?,?,?)",
    [customerId, "CREATED", total]
  );
  return res.insertId as number;
};

export const insertItem = async (
  orderId: number,
  productId: number,
  qty: number,
  unitPrice: number,
  conn: any
) => {
  const subtotal = qty * unitPrice;
  await conn.query(
    "INSERT INTO order_items (order_id, product_id, qty, unit_price_cents, subtotal_cents) VALUES (?,?,?,?,?)",
    [orderId, productId, qty, unitPrice, subtotal]
  );
};

export const decreaseStock = async (
  productId: number,
  qty: number,
  conn: any
) => {
  await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
    qty,
    productId,
  ]);
};

export const getOrderStatus = async (orderId: number, conn: any) => {
  const [rows]: any = await conn.query(
    "SELECT status FROM orders WHERE id = ? FOR UPDATE",
    [orderId]
  );
  return rows[0];
};

export const setOrderStatus = async (
  orderId: number,
  status: string,
  conn: any
) => {
  await conn.query("UPDATE orders SET status=? WHERE id=?", [status, orderId]);
};

export const saveIdempotencyPending = async (
  key: string,
  orderId: number,
  conn: any
) => {
  await conn.query(
    "INSERT INTO idempotency_keys (`key`, target_type, target_id, status) VALUES (?,?,?,?)",
    [key, "ORDER_CONFIRMATION", orderId, "PENDING"]
  );
};

export const getIdempotentResponse = async (key: string, conn?: any) => {
  const c = conn ?? pool;
  const [rows]: any = await c.query(
    "SELECT response_body FROM idempotency_keys WHERE `key` = ?",
    [key]
  );
  return rows[0]?.response_body ?? null;
};

export const setIdempotentResponse = async (
  key: string,
  body: any,
  conn: any
) => {
  await conn.query(
    "UPDATE idempotency_keys SET status='COMPLETED', response_body=? WHERE `key`=?",
    [JSON.stringify(body), key]
  );
};

export const buildOrderResponse = async (orderId: number, conn?: any) => {
  const c = conn ?? pool;
  const [[order]]: any = await c.query("SELECT * FROM orders WHERE id = ?", [
    orderId,
  ]);
  const [items]: any = await c.query(
    "SELECT product_id, qty, cast(unit_price_cents/100 as decimal(10,2)) as unit_price_cents, cast(subtotal_cents/100 as decimal(10,2)) as subtotal_cents FROM order_items WHERE order_id = ?",
    [orderId]
  );

  return {
    id: order.id,
    status: order.status,
    total_cents: (order.total_cents / 100).toFixed(2),
    items,
  };
};

export const findOrderWithItems = async (orderId: number) => {
  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_id,
      o.status,
      o.total_cents,
      o.created_at,
      i.product_id,
      p.name AS product_name,
      i.qty,
      i.unit_price_cents
    FROM orders o
    JOIN order_items i ON i.order_id = o.id
    JOIN products p ON p.id = i.product_id
    WHERE o.id = ?;
  `;

  const [rows] = await pool.execute(sql, [orderId]);
  return rows as any[];
};
