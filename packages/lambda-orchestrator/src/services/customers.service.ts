import { createHttpClient } from "../utils/httpClient.js";

const client = createHttpClient(process.env.CUSTOMERS_API_BASE!, process.env.SERVICE_TOKEN);

export async function getCustomer(customerId: number) {
  const { data } = await client.get(`/internal/customers/${customerId}`);
  return data;
}
