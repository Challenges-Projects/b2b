export interface OrchestratorInput {
  customer_id: number;
  items: { product_id: number; qty: number }[];
  idempotency_key: string;
  correlation_id?: string;
}

export interface OrchestratorResponse {
  success: boolean;
  correlationId?: string;
  data?: any;
  error?: string;
}
