import 'dotenv/config';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import morgan from "morgan";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware.js";
import routesOrders  from "./routes/orders.routes.js";
import productsOrders  from "./routes/products.routes.js";
import { existsSync } from "fs";

// 🧠 reconstruimos __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta absoluta hacia el archivo openapi.yaml
// const swaggerPath = path.resolve(__dirname, "../openapi.yaml");
let swaggerPath = path.resolve(__dirname, "../openapi.yaml");
console.log(`ruta ${swaggerPath}`)
if (!existsSync(swaggerPath)) {
  swaggerPath = path.resolve(__dirname, "../../openapi.yaml");
}

const swaggerDocument = YAML.load(swaggerPath);


export const app = express();
app.use(cors(
    {
    origin: "*", // o restringe a ["http://localhost:3002"]
    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
));
app.use(express.json());
app.use(morgan("dev"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/", [routesOrders,productsOrders]);
app.use(errorHandler);
