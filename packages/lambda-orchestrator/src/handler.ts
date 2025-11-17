import { OrchestratorInputSchema } from "./schemas/orchestrator.schema.js";
import { getCustomer } from "./services/customers.service.js";
import { createOrder, confirmOrder } from "./services/orders.service.js";
import { OrchestratorInput, OrchestratorResponse } from "./types.js";

export const createAndConfirmOrder = async (event: any) => {
  try {
    // const body: OrchestratorInput = JSON.parse(event.body);
    // const { customer_id, items, idempotency_key, correlation_id } = body;

    // if (!customer_id || !items?.length || !idempotency_key) {
    //   return {
    //     success: false,
    //     error:
    //       "Missing required fields (customer_id, items[], idempotency_key)",
    //   };
    // }

    const raw =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const parsed = OrchestratorInputSchema.safeParse(raw);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          //error: parsed.error.issues
          errors: parsed.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
      };
    }

    const { customer_id, items, idempotency_key, correlation_id } = parsed.data;
    // 1. Validar si el cliente existe
    console.log("🟦 Validating customer ...");

    const customer = await getCustomer(customer_id);
    if (customer.status >= 400) {
      return {
        statusCode: customer.status,
        body: JSON.stringify({ error: "Cliente no encontrado" }),
      };
    }

    if (customer.status >= 500) {
      return {
        statusCode: customer.status,
        body: JSON.stringify({ error: "Error en customers API" }),
      };
    }

    //2. Crear Orden
    console.log("🟩 Creating order...");
    const order = await createOrder({ customer_id, items });
    if (order.status >= 400) {
      return {
        statusCode: order.status,
        body: JSON.stringify({ error: "Error al crear Orden" }),
      };
    }

    if (order.status >= 500) {
      return {
        statusCode: order.status,
        body: JSON.stringify({ error: "Error en orders API" }),
      };
    }

    //3. Confirmar orden
    console.log("🟨 Confirming order...");
    const confirmed = await confirmOrder(order.data.id, idempotency_key);

    if (confirmed.status >= 400) {
      return {
        statusCode: confirmed.status,
        body: JSON.stringify({ error: "Error al confirmar Orden" }),
      };
    }

    if (confirmed.status >= 500) {
      return {
        statusCode: confirmed.status,
        body: JSON.stringify({ error: "Error en orders API" }),
      };
    }

    const response = {
      success: true,
      correlationId: correlation_id,
      data: {
        customer:customer.data,
        order: confirmed.data,
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
