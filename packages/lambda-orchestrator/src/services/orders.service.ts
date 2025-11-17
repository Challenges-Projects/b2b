import { createHttpClient } from "../utils/httpClient.js";

const client = createHttpClient(
  process.env.ORDERS_API_BASE!,
  process.env.SERVICE_TOKEN
);

export const createOrder = async (payload: {
  customer_id: number;
  items: any[];
}) => {
  //console.log(`${process.env.ORDERS_API_BASE}/orders`)
  //console.log(payload)
  const { data, status } = await client.post("/orders", payload);
  return { data, status };
};

export const confirmOrder = async (orderId: number, idempotencyKey: string) => {
  const { data, status } = await client.post(
    `/orders/${orderId}/confirm`,
    {},
    {
      headers: { "X-Idempotency-Key": idempotencyKey },
    }
  );
  return { data, status };
};
