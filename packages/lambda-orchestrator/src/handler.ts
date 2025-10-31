import { getCustomer } from "./services/customers.service.js";
import { createOrder, confirmOrder } from "./services/orders.service.js";
import { OrchestratorInput, OrchestratorResponse } from "./types.js";

export const createAndConfirmOrder = async (event: any) => {
  try {
    const body: OrchestratorInput = JSON.parse(event.body);
    const { customer_id, items, idempotency_key, correlation_id } = body;

    if (!customer_id || !items?.length || !idempotency_key) {
      return {
        success: false,
        error:
          "Missing required fields (customer_id, items[], idempotency_key)",
      };
    }

    console.log("🟦 Validating customer xyz...");
    const customer = await getCustomer(customer_id);
    console.log(customer);
    console.log("🟩 Creating order...");
    const order = await createOrder({ customer_id, items });

    console.log("🟨 Confirming order...");
    const confirmed = await confirmOrder(order.id, idempotency_key);

    const response = {
      success: true,
      correlationId: correlation_id,
      data: {
        customer,
        order: confirmed,
      },
    };

    console.log("✅ Orchestration completed:", response);
    return {
      statusCode: 201,
      body: JSON.stringify(response), // 👈 importante: debe ser un string
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error: any) {
    console.error("❌ Orchestration failed:", error.message);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
};
