import { createHttpClient } from "../utils/httpClient.js";

const client = createHttpClient(process.env.CUSTOMERS_API_BASE!, process.env.SERVICE_TOKEN);

export const getCustomer=async (customerId: number) => {
  const { data,status } = await client.get(`/internal/customers/${customerId}`);
  return {data,status};
}
